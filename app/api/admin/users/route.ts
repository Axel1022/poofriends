import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// Middleware para verificar que el usuario sea admin
async function verifyAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { authorized: false, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    return { authorized: false, error: "Acceso denegado. Se requieren permisos de administrador." };
  }

  return { authorized: true, user };
}

// GET /api/admin/users - Listar todos los usuarios (solo admin)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      );
    }

    // Obtener parámetros de paginación y filtros
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', 'suspended', 'all'
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    }

    // Obtener usuarios (respetando privacidad - solo info básica)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          isSuspended: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              bathroomLogs: true,
              groupsCreated: true,
              groupMembers: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al obtener los usuarios" },
      { status: 500 }
    );
  }
}
