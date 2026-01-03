import prisma from '@/lib/db';

export async function updateStreak(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Crear nueva racha
      streak = await prisma.streak.create({
        data: {
          userId,
          currentDays: 1,
          longestDays: 1,
          lastLogDate: today,
        },
      });
      return streak;
    }

    // Si no hay fecha de último log, establecer hoy como primer día
    if (!streak.lastLogDate) {
      await prisma.streak.update({
        where: { userId },
        data: {
          currentDays: 1,
          longestDays: Math.max(1, streak.longestDays),
          lastLogDate: today,
        },
      });
      return;
    }

    const lastLogDate = new Date(streak.lastLogDate);
    lastLogDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Ya se logueó hoy, no hacer nada
      return;
    } else if (diffDays === 1) {
      // Día consecutivo, incrementar racha
      const newCurrentDays = streak.currentDays + 1;
      const newLongestDays = Math.max(newCurrentDays, streak.longestDays);

      await prisma.streak.update({
        where: { userId },
        data: {
          currentDays: newCurrentDays,
          longestDays: newLongestDays,
          lastLogDate: today,
        },
      });

      // Crear notificación de logro si alcanza múltiplos de 7
      if (newCurrentDays % 7 === 0) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT',
            message: `¡Increíble! Llevas ${newCurrentDays} días consecutivos 🔥`,
            link: '/stats',
          },
        });
      }
    } else {
      // Se rompió la racha, reiniciar
      await prisma.streak.update({
        where: { userId },
        data: {
          currentDays: 1,
          lastLogDate: today,
        },
      });
    }
  } catch (error) {
    console.error('Error al actualizar racha:', error);
  }
}
