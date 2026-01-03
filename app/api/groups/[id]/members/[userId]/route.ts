import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const groupId = params.id;
    const targetUserId = params.userId;

    // User cannot kick themselves
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "No puedes expulsarte a ti mismo" },
        { status: 400 }
      );
    }

    // Check if current user is the leader
    const leadership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: currentUserId,
        role: "LEADER",
        status: "APPROVED",
      },
    });

    if (!leadership) {
      return NextResponse.json(
        { error: "Solo el líder puede expulsar miembros" },
        { status: 403 }
      );
    }

    // Find the target member
    const targetMember = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: targetUserId,
        status: "APPROVED",
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "Usuario no encontrado en el grupo" },
        { status: 404 }
      );
    }

    // Remove the member
    await prisma.groupMember.delete({
      where: {
        id: targetMember.id,
      },
    });

    return NextResponse.json(
      { message: "Usuario expulsado del grupo exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kick member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
