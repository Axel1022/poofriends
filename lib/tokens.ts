import crypto from 'crypto';
import prisma from './db';

// Generar token aleatorio seguro
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Crear token de verificación de email
export async function createEmailVerificationToken(userId: string) {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Expira en 24 horas

  // Eliminar tokens antiguos del usuario
  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
    },
  });

  // Crear nuevo token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      type: 'EMAIL_VERIFICATION',
      expires,
    },
  });

  return token;
}

// Crear token de recuperación de contraseña
export async function createPasswordResetToken(userId: string) {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Expira en 1 hora

  // Eliminar tokens antiguos del usuario
  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
      type: 'PASSWORD_RESET',
    },
  });

  // Crear nuevo token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      type: 'PASSWORD_RESET',
      expires,
    },
  });

  return token;
}

// Verificar token de email
export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  if (!verificationToken || verificationToken.type !== 'EMAIL_VERIFICATION') {
    return { valid: false, error: 'Token inválido' };
  }

  if (verificationToken.expires < new Date()) {
    // Token expirado, eliminar
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    return { valid: false, error: 'Token expirado' };
  }

  return { valid: true, user: verificationToken.user, tokenId: verificationToken.id };
}

// Verificar token de recuperación de contraseña
export async function verifyPasswordResetToken(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  if (!verificationToken || verificationToken.type !== 'PASSWORD_RESET') {
    return { valid: false, error: 'Token inválido' };
  }

  if (verificationToken.expires < new Date()) {
    // Token expirado, eliminar
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    return { valid: false, error: 'Token expirado' };
  }

  return { valid: true, user: verificationToken.user, tokenId: verificationToken.id };
}

// Limpiar tokens expirados (puede ejecutarse periódicamente)
export async function cleanupExpiredTokens() {
  await prisma.emailVerificationToken.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
}
