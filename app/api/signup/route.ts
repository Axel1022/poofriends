import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendEmail, getVerificationEmailHTML } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, name } = body;

    // Validaciones
    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario (inactivo por defecto)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isActive: false, // Cuenta inactiva hasta verificar email
      },
    });

    // Crear token de verificación
    const token = await createEmailVerificationToken(user.id);

    // Generar URL de verificación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Enviar email de verificación
    try {
      await sendEmail({
        to: email,
        subject: 'Verifica tu cuenta en PooFriends',
        html: getVerificationEmailHTML(name, verificationUrl),
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // No fallar el registro si el email no se pudo enviar
      // El usuario puede solicitar reenvío después
    }

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente. Por favor verifica tu correo electrónico.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error durante el registro" },
      { status: 500 }
    );
  }
}
