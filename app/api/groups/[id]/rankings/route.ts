import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/groups/[id]/rankings - Obtener rankings y estadísticas del grupo
export async function GET(
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

    const groupId = params.id;

    // Verificar que el usuario es miembro del grupo
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        status: 'APPROVED',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      );
    }

    // Obtener todos los miembros aprobados del grupo
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calcular estadísticas para cada miembro
    const memberStats = await Promise.all(
      members.map(async (member) => {
        const totalLogs = await prisma.bathroomLog.count({
          where: { userId: member.userId },
        });

        const last7DaysLogs = await prisma.bathroomLog.count({
          where: {
            userId: member.userId,
            timestamp: { gte: sevenDaysAgo },
          },
        });

        const last30DaysLogs = await prisma.bathroomLog.count({
          where: {
            userId: member.userId,
            timestamp: { gte: thirtyDaysAgo },
          },
        });

        // Obtener racha actual
        const streak = await prisma.streak.findUnique({
          where: { userId: member.userId },
        });

        return {
          user: member.user,
          totalLogs,
          last7DaysLogs,
          last30DaysLogs,
          dailyAverage7: (last7DaysLogs / 7).toFixed(1),
          dailyAverage30: (last30DaysLogs / 30).toFixed(1),
          currentStreak: streak?.currentDays || 0,
          longestStreak: streak?.longestDays || 0,
        };
      })
    );

    // Rankings por diferentes categorías
    const rankings = {
      totalLogs: [...memberStats].sort((a, b) => b.totalLogs - a.totalLogs),
      last7Days: [...memberStats].sort(
        (a, b) => b.last7DaysLogs - a.last7DaysLogs
      ),
      last30Days: [...memberStats].sort(
        (a, b) => b.last30DaysLogs - a.last30DaysLogs
      ),
      currentStreak: [...memberStats].sort(
        (a, b) => b.currentStreak - a.currentStreak
      ),
      longestStreak: [...memberStats].sort(
        (a, b) => b.longestStreak - a.longestStreak
      ),
    };

    // Estadísticas del grupo
    const groupTotalLogs = memberStats.reduce(
      (sum, m) => sum + m.totalLogs,
      0
    );
    const groupAverage7Days =
      memberStats.reduce((sum, m) => sum + parseFloat(m.dailyAverage7), 0) /
      memberStats.length;
    const groupAverage30Days =
      memberStats.reduce((sum, m) => sum + parseFloat(m.dailyAverage30), 0) /
      memberStats.length;

    return NextResponse.json({
      rankings,
      groupStats: {
        totalMembers: members.length,
        totalLogs: groupTotalLogs,
        avgDailyLogs7: groupAverage7Days.toFixed(1),
        avgDailyLogs30: groupAverage30Days.toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error al obtener rankings:', error);
    return NextResponse.json(
      { error: 'Error al obtener rankings' },
      { status: 500 }
    );
  }
}
