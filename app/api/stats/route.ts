import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const totalLogs = await prisma.bathroomLog.count({
      where: { userId },
    });

    const logs = await prisma.bathroomLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const last7Days = logs.filter((log: any) => log.timestamp >= sevenDaysAgo).length;
    const last30Days = logs.filter((log: any) => log.timestamp >= thirtyDaysAgo).length;
    const last90Days = logs.filter((log: any) => log.timestamp >= ninetyDaysAgo).length;

    const typeDistribution = logs.reduce((acc: any, log: any) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    const moodDistribution = logs
      .filter((log: any) => log.mood)
      .reduce((acc: any, log: any) => {
        acc[log.mood as string] = (acc[log.mood as string] || 0) + 1;
        return acc;
      }, {});

    const hourlyDistribution = logs.reduce((acc: any, log: any) => {
      const hour = log.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const dayOfWeekDistribution = logs.reduce((acc: any, log: any) => {
      const day = log.timestamp.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const groupCount = await prisma.groupMember.count({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    return NextResponse.json({
      totalLogs,
      averages: {
        daily7: (last7Days / 7).toFixed(1),
        daily30: (last30Days / 30).toFixed(1),
        daily90: (last90Days / 90).toFixed(1),
        weekly: ((last30Days / 30) * 7).toFixed(1),
      },
      distributions: {
        type: typeDistribution,
        mood: moodDistribution,
        hourly: hourlyDistribution,
        dayOfWeek: dayOfWeekDistribution,
      },
      groupCount,
      memberSince: user?.createdAt,
      lastLog: logs[0] || null,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
