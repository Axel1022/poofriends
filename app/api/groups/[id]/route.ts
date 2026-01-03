import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

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
    const { id } = params;

    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId,
        status: "APPROVED",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            status: "APPROVED",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                _count: {
                  select: { bathroomLogs: true },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const memberIds = group.members.map((m: any) => m.userId);

    const recentLogs = await prisma.bathroomLog.findMany({
      where: {
        userId: { in: memberIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    const totalLogs = await prisma.bathroomLog.count({
      where: {
        userId: { in: memberIds },
      },
    });

    // Get pending requests count if user is leader
    let pendingRequestsCount = 0;
    if (membership.role === "LEADER") {
      pendingRequestsCount = await prisma.groupMember.count({
        where: {
          groupId: id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({
      group,
      recentLogs,
      totalLogs,
      myRole: membership.role,
      pendingRequestsCount,
    });
  } catch (error) {
    console.error("Get group details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group details" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id] - Actualizar configuración del grupo (solo líder)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;

    // Verificar que el usuario sea el líder
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: user.id,
        role: "LEADER",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Solo el líder puede actualizar el grupo" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isPublic, whatsappLink } = body;

    // Actualizar el grupo
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        ...(typeof isPublic === "boolean" && { isPublic }),
        ...(whatsappLink !== undefined && { whatsappLink }),
      },
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error("Error al actualizar grupo:", error);
    return NextResponse.json(
      { error: "Error al actualizar grupo" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Eliminar grupo (solo líder)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;

    // Verificar que el usuario sea el líder
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: user.id,
        role: "LEADER",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Solo el líder puede eliminar el grupo" },
        { status: 403 }
      );
    }

    // Eliminar el grupo (cascade eliminará los miembros automáticamente)
    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Grupo eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    return NextResponse.json(
      { error: "Error al eliminar grupo" },
      { status: 500 }
    );
  }
}
