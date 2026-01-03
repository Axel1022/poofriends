import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { sendEmail, getAccountSuspendedEmailHTML } from "@/lib/email";

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

// POST /api/admin/users/[id]/suspend - Suspender usuario (solo admin)
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
    const body = await req.json();
    const { reason } = body;

    // No permitir que un admin se suspenda a sí mismo
    if (auth.user!.id === id) {
      return NextResponse.json(
        { error: "No puedes suspender tu propia cuenta" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // No permitir suspender otros administradores
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "No puedes suspender a otros administradores" },
        { status: 400 }
      );
    }

    // Suspender usuario
    await prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
      },
    });

    // Enviar email de notificación
    try {
      await sendEmail({
        to: user.email,
        subject: 'Tu cuenta ha sido suspendida - PooFriends',
        html: getAccountSuspendedEmailHTML(user.name, reason),
      });
    } catch (emailError) {
      console.error('Error sending suspension email:', emailError);
      // No fallar la operación si el email no se puede enviar
    }

    return NextResponse.json(
      { message: "Usuario suspendido exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin suspend user error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al suspender el usuario" },
      { status: 500 }
    );
  }
}
