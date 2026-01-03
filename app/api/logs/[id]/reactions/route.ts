import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/logs/[id]/reactions - Obtener todas las reacciones de un log
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const logId = params.id;

    const reactions = await prisma.reaction.findMany({
      where: { logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar reacciones por emoji
    const grouped = reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        name: reaction.user.name,
        avatarUrl: reaction.user.avatarUrl,
      });
      return acc;
    }, {});

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    return NextResponse.json({
      reactions: Object.values(grouped),
      userReactions: currentUser
        ? reactions
            .filter((r) => r.user.id === currentUser.id)
            .map((r) => r.emoji)
        : [],
    });
  } catch (error) {
    console.error('Error al obtener reacciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener reacciones' },
      { status: 500 }
    );
  }
}

// POST /api/logs/[id]/reactions - Agregar o quitar reacción
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const logId = params.id;
    const { emoji } = await request.json();

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json(
        { error: 'Emoji inválido' },
        { status: 400 }
      );
    }

    // Verificar que el log existe
    const log = await prisma.bathroomLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene esta reacción
    const existing = await prisma.reaction.findFirst({
      where: {
        logId,
        userId: user.id,
        emoji,
      },
    });

    if (existing) {
      // Si ya existe, la quitamos (toggle)
      await prisma.reaction.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        message: 'Reacción eliminada',
        action: 'removed',
      });
    } else {
      // Si no existe, la agregamos
      await prisma.reaction.create({
        data: {
          logId,
          userId: user.id,
          emoji,
        },
      });

      // Crear notificación si no es el propio usuario
      if (log.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: log.userId,
            senderId: user.id,
            type: 'REACTION',
            message: `${user.name} reaccionó ${emoji} a tu registro`,
            link: `/dashboard`,
          },
        });
      }

      return NextResponse.json({
        message: 'Reacción agregada',
        action: 'added',
      });
    }
  } catch (error) {
    console.error('Error al procesar reacción:', error);
    return NextResponse.json(
      { error: 'Error al procesar reacción' },
      { status: 500 }
    );
  }
}
