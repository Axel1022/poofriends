import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const groupMembers = await prisma.groupMember.findMany({
      where: { 
        userId,
        status: "APPROVED"
      },
      include: {
        group: {
          include: {
            _count: {
              select: { 
                members: {
                  where: { status: "APPROVED" }
                }
              },
            },
          },
        },
      },
    });

    const groupsWithPendingCounts = await Promise.all(
      groupMembers.map(async (gm: any) => {
        let pendingRequestsCount = 0;
        if (gm.role === "LEADER") {
          pendingRequestsCount = await prisma.groupMember.count({
            where: {
              groupId: gm.groupId,
              status: "PENDING",
            },
          });
        }
        return {
          ...gm.group,
          memberCount: gm.group._count?.members ?? 0,
          myRole: gm.role,
          pendingRequestsCount,
        };
      })
    );

    const groups = groupsWithPendingCounts;

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    let inviteCode = generateInviteCode();
    let codeExists = await prisma.group.findUnique({
      where: { inviteCode },
    });

    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await prisma.group.findUnique({
        where: { inviteCode },
      });
    }

    const group = await prisma.group.create({
      data: {
        name,
        inviteCode,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: "LEADER",
            status: "APPROVED",
          },
        },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
