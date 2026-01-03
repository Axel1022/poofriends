import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/groups/join/cancel - Cancelar solicitud pendiente
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: "Se requiere groupId" },
        { status: 400 }
      );
    }

    // Buscar la solicitud pendiente
    const pendingRequest = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!pendingRequest) {
      return NextResponse.json(
        { error: "No se encontró una solicitud pendiente para este grupo" },
        { status: 404 }
      );
    }

    // Eliminar la solicitud
    await prisma.groupMember.delete({
      where: {
        id: pendingRequest.id,
      },
    });

    return NextResponse.json(
      { message: "Solicitud cancelada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel request error:", error);
    return NextResponse.json(
      { error: "Error al cancelar solicitud" },
      { status: 500 }
    );
  }
}
