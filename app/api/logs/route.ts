import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { updateStreak } from "@/lib/utils/streaks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const logs = await prisma.bathroomLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Get logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { type, mood, comment } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Visit type is required" },
        { status: 400 }
      );
    }

    const log = await prisma.bathroomLog.create({
      data: {
        userId,
        type,
        mood: mood || null,
        comment: comment || null,
        timestamp: new Date(),
      },
    });

    // Actualizar racha del usuario
    await updateStreak(userId);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Create log error:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
