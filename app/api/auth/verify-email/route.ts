import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyEmailToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// POST /api/auth/verify-email - Verificar email con token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token es requerido" },
        { status: 400 }
      );
    }

    // Verificar token
    const result = await verifyEmailToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Activar cuenta del usuario
    await prisma.user.update({
      where: { id: result.user!.id },
      data: {
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // Eliminar token usado
    await prisma.emailVerificationToken.delete({
      where: { id: result.tokenId },
    });

    return NextResponse.json(
      {
        message: "¡Correo verificado exitosamente! Ya puedes iniciar sesión.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al verificar el correo" },
      { status: 500 }
    );
  }
}
