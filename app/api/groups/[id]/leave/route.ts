import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export async function POST(
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

    // Find user's membership
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: "APPROVED",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No eres miembro de este grupo" },
        { status: 404 }
      );
    }

    // If user is leader, check if there are other approved members
    if (membership.role === "LEADER") {
      const otherMembers = await prisma.groupMember.count({
        where: {
          groupId,
          status: "APPROVED",
          userId: { not: userId },
        },
      });

      if (otherMembers > 0) {
        return NextResponse.json(
          { error: "No puedes salir del grupo siendo líder. Expulsa a los demás miembros primero." },
          { status: 400 }
        );
      }
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: {
        id: membership.id,
      },
    });

    // If leader left and no other members, optionally delete the group
    if (membership.role === "LEADER") {
      await prisma.group.delete({
        where: { id: groupId },
      });
    }

    return NextResponse.json(
      { message: "Has salido del grupo exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Leave group error:", error);
    return NextResponse.json(
      { error: "Failed to leave group" },
      { status: 500 }
    );
  }
}
