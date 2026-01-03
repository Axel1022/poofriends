import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendEmail, getPasswordResetEmailHTML } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Por seguridad, siempre devolver el mismo mensaje
    if (!user) {
      return NextResponse.json(
        { message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña." },
        { status: 200 }
      );
    }

    // Si la cuenta está suspendida, no permitir reset
    if (user.isSuspended) {
      return NextResponse.json(
        { message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña." },
        { status: 200 }
      );
    }

    // Crear token de reset
    const token = await createPasswordResetToken(user.id);

    // Generar URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Enviar email
    await sendEmail({
      to: email,
      subject: 'Recupera tu contraseña - PooFriends',
      html: getPasswordResetEmailHTML(user.name, resetUrl),
    });

    return NextResponse.json(
      { message: "Si el correo existe, recibirás instrucciones para recuperar tu contraseña." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar tu solicitud" },
      { status: 500 }
    );
  }
}
