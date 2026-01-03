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

// GET /api/admin/users/[id] - Obtener detalles de un usuario (solo admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      );
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
        _count: {
          select: {
            bathroomLogs: true,
            groupsCreated: true,
            groupMembers: true,
            reactions: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al obtener el usuario" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Eliminar usuario permanentemente (solo admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      );
    }

    const { id } = params;

    // No permitir que un admin se elimine a sí mismo
    if (auth.user!.id === id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar otros administradores
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "No puedes eliminar a otros administradores" },
        { status: 400 }
      );
    }

    // Eliminar usuario (cascade eliminará sus registros relacionados)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Usuario eliminado permanentemente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
