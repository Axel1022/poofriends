import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { sendEmail, getAccountActivatedEmailHTML } from "@/lib/email";

export const dynamic = "force-dynamic";

// Middleware para verificar que el usuario sea admin
async function verifyAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { authorized: false, error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    return { authorized: false, error: "Acceso denegado. Se requieren permisos de administrador." };
  }

  return { authorized: true, user };
}

// POST /api/admin/users/[id]/activate - Activar/reactivar usuario (solo admin)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      );
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Activar usuario y quitar suspensión
    await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        isSuspended: false,
        emailVerified: user.emailVerified || new Date(), // Si no tenía emailVerified, asignar ahora
      },
    });

    // Enviar email de notificación
    try {
      await sendEmail({
        to: user.email,
        subject: 'Tu cuenta ha sido activada - PooFriends',
        html: getAccountActivatedEmailHTML(user.name),
      });
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
      // No fallar la operación si el email no se puede enviar
    }

    return NextResponse.json(
      { message: "Usuario activado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin activate user error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al activar el usuario" },
      { status: 500 }
    );
  }
}
