import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/groups/explore - Obtener todos los grupos públicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todos los grupos públicos
    const publicGroups = await prisma.group.findMany({
      where: {
        isPublic: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agregar información de membresía del usuario actual
    const groupsWithMembership = publicGroups.map((group) => {
      const userMembership = group.members.find((m) => m.userId === user.id);
      const approvedMembers = group.members.filter((m) => m.status === 'APPROVED');
      
      return {
        ...group,
        memberCount: approvedMembers.length,
        isMember: userMembership?.status === 'APPROVED',
        hasPendingRequest: userMembership?.status === 'PENDING',
        members: approvedMembers, // Solo mostrar miembros aprobados
      };
    });

    return NextResponse.json({ groups: groupsWithMembership });
  } catch (error) {
    console.error('Error al obtener grupos públicos:', error);
    return NextResponse.json(
      { error: 'Error al obtener grupos públicos' },
      { status: 500 }
    );
  }
}
