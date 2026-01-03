import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendEmail, getVerificationEmailHTML } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/auth/resend-verification - Reenviar email de verificación
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

    if (!user) {
      // Por seguridad, no revelar si el usuario existe o no
      return NextResponse.json(
        { message: "Si el correo existe, recibirás un email de verificación." },
        { status: 200 }
      );
    }

    // Si la cuenta ya está activa
    if (user.isActive) {
      return NextResponse.json(
        { error: "Esta cuenta ya está verificada" },
        { status: 400 }
      );
    }

    // Crear nuevo token
    const token = await createEmailVerificationToken(user.id);

    // Generar URL de verificación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Enviar email
    await sendEmail({
      to: email,
      subject: 'Verifica tu cuenta en PooFriends',
      html: getVerificationEmailHTML(user.name, verificationUrl),
    });

    return NextResponse.json(
      { message: "Email de verificación enviado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al enviar el email" },
      { status: 500 }
    );
  }
}
