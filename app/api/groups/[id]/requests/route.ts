import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const groupId = params.id;

    // Check if user is the leader of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        role: "LEADER",
        status: "APPROVED",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Solo el líder del grupo puede ver las solicitudes" },
        { status: 403 }
      );
    }

    // Get pending requests
    const requests = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
