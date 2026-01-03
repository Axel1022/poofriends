import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const groupId = params.id;
    const requestUserId = params.userId;

    // Check if current user is the leader
    const leadership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: currentUser.id,
        role: "LEADER",
        status: "APPROVED",
      },
    });

    if (!leadership) {
      return NextResponse.json(
        { error: "Solo el líder puede rechazar solicitudes" },
        { status: 403 }
      );
    }

    // Find the pending request
    const request = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: requestUserId,
        status: "PENDING",
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Get group info for notification
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    // Delete the request
    await prisma.groupMember.delete({
      where: {
        id: request.id,
      },
    });

    // Crear notificación para el usuario
    await prisma.notification.create({
      data: {
        userId: requestUserId,
        senderId: currentUser.id,
        type: "GROUP_REQUEST",
        message: `Tu solicitud para unirte a ${group?.name} fue rechazada`,
        link: `/groups/explore`,
        read: false,
      },
    });

    return NextResponse.json(
      { message: "Solicitud rechazada" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject request error:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
