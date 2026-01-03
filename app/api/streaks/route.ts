import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/streaks - Obtener racha del usuario
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

    let streak = await prisma.streak.findUnique({
      where: { userId: user.id },
    });

    // Si no existe, crear una nueva racha
    if (!streak) {
      streak = await prisma.streak.create({
        data: {
          userId: user.id,
          currentDays: 0,
          longestDays: 0,
        },
      });
    }

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Error al obtener racha:', error);
    return NextResponse.json(
      { error: 'Error al obtener racha' },
      { status: 500 }
    );
  }
}
