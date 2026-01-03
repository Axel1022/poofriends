import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { inviteCode, groupId } = body;

    let group;

    // Si se proporciona groupId (para grupos públicos), usar ese
    // Si se proporciona inviteCode, buscar por código
    if (groupId) {
      group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: {
            where: { role: "LEADER" },
            select: { userId: true },
          },
        },
      });
    } else if (inviteCode) {
      group = await prisma.group.findUnique({
        where: { inviteCode: inviteCode.toUpperCase() },
        include: {
          members: {
            where: { role: "LEADER" },
            select: { userId: true },
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: "Se requiere groupId o inviteCode" },
        { status: 400 }
      );
    }

    if (!group) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Check if user already has a request or is a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
      },
    });

    if (existingMember) {
      if (existingMember.status === "PENDING") {
        return NextResponse.json(
          { error: "Ya tienes una solicitud pendiente para este grupo" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Ya eres miembro de este grupo" },
        { status: 400 }
      );
    }

    // Check if user is already in 2 approved groups
    const approvedGroupsCount = await prisma.groupMember.count({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
    });

    if (approvedGroupsCount >= 2) {
      return NextResponse.json(
        { error: "Ya estás en el máximo de 2 grupos. Debes salir de uno antes de unirte a otro." },
        { status: 400 }
      );
    }

    // Create pending membership request
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: "MEMBER",
        status: "PENDING",
      },
    });

    // Crear notificación para el líder
    const leaderId = group.members[0]?.userId;
    if (leaderId) {
      await prisma.notification.create({
        data: {
          userId: leaderId,
          senderId: user.id,
          type: "GROUP_REQUEST",
          message: `${user.name} quiere unirse a ${group.name}`,
          link: `/groups/${group.id}`,
          read: false,
        },
      });
    }

    return NextResponse.json(
      { message: "Solicitud enviada correctamente. El líder del grupo la revisará pronto.", group },
      { status: 201 }
    );
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
