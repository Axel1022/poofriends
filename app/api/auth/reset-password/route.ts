import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { verifyPasswordResetToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// POST /api/auth/reset-password - Restablecer contraseña con token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
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

    // Verificar token
    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: result.user!.id },
      data: {
        password: hashedPassword,
      },
    });

    // Eliminar token usado
    await prisma.emailVerificationToken.delete({
      where: { id: result.tokenId },
    });

    return NextResponse.json(
      { message: "Contraseña restablecida exitosamente. Ya puedes iniciar sesión." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al restablecer la contraseña" },
      { status: 500 }
    );
  }
}
