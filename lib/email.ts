import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Función para crear el transportador bajo demanda
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // APP PASSWORD
    },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Si no hay credenciales de email configuradas o son placeholders, no intentar enviar

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASSWORD length:", process.env.EMAIL_PASSWORD?.length);

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (
    !emailUser ||
    !emailPassword ||
    emailUser.includes("tu-correo") ||
    emailPassword.includes("tu-contraseña") ||
    emailPassword.includes("app-password")
  ) {
    console.log("Email credentials not configured, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"PooFriends" <no-reply.poofriends@gmail.com>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // No log error during testing if credentials are invalid
    if (process.env.__NEXT_TEST_MODE !== "1") {
      console.error("Error sending email:", error);
    }
    return { success: false, error };
  }
}

// Template de email de verificación
export function getVerificationEmailHTML(
  name: string,
  verificationUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu cuenta - PooFriends</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #9333ea; margin: 0; font-size: 32px;">💩 PooFriends</h1>
        </div>

        <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">¡Bienvenido, ${name}!</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte en PooFriends. Estás a un paso de unirte a nuestra comunidad.
          </p>
        </div>

        <div style="padding: 20px 0;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Para activar tu cuenta y comenzar a usar PooFriends, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verificar mi cuenta
            </a>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 25px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #9333ea; font-size: 14px; word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin-top: 10px;">
            ${verificationUrl}
          </p>

          <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
              <strong>Nota:</strong> Este enlace expirará en 24 horas por razones de seguridad.
            </p>
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 15px 0 0 0;">
              Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 PooFriends. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template de email de recuperación de contraseña
export function getPasswordResetEmailHTML(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar contraseña - PooFriends</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #9333ea; margin: 0; font-size: 32px;">💩 PooFriends</h1>
        </div>

        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">🔑 Recuperar Contraseña</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">
            Hemos recibido una solicitud para restablecer tu contraseña.
          </p>
        </div>

        <div style="padding: 20px 0;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Hola ${name},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Para crear una nueva contraseña, haz clic en el botón de abajo:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Restablecer Contraseña
            </a>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 25px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #f59e0b; font-size: 14px; word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin-top: 10px;">
            ${resetUrl}
          </p>

          <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
              <strong>Nota:</strong> Este enlace expirará en 1 hora por razones de seguridad.
            </p>
            <p style="color: #dc2626; font-size: 13px; line-height: 1.6; margin: 15px 0 0 0; font-weight: bold;">
              Si no solicitaste restablecer tu contraseña, ignora este correo. Tu contraseña no cambiará.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 PooFriends. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template de email de cuenta suspendida
export function getAccountSuspendedEmailHTML(name: string, reason?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cuenta Suspendida - PooFriends</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #9333ea; margin: 0; font-size: 32px;">💩 PooFriends</h1>
        </div>

        <div style="background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">⚠️ Cuenta Suspendida</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">
            Tu cuenta ha sido temporalmente suspendida.
          </p>
        </div>

        <div style="padding: 20px 0;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Hola ${name},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Lamentamos informarte que tu cuenta en PooFriends ha sido suspendida temporalmente.
          </p>
          ${
            reason
              ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>Razón:</strong> ${reason}
            </p>
          </div>
          `
              : ""
          }
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 25px 0;">
            Si crees que esto es un error o deseas apelar esta decisión, por favor contáctanos respondiendo a este correo.
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 PooFriends. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template de email de cuenta activada
export function getAccountActivatedEmailHTML(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cuenta Activada - PooFriends</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #9333ea; margin: 0; font-size: 32px;">💩 PooFriends</h1>
        </div>

        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">✅ Cuenta Activada</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">
            Tu cuenta ha sido reactivada exitosamente.
          </p>
        </div>

        <div style="padding: 20px 0;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Hola ${name},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Nos complace informarte que tu cuenta en PooFriends ha sido reactivada. Ya puedes iniciar sesión y continuar usando nuestros servicios.
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "https://poofriends.abacusai.app"
            }/login"
               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Iniciar Sesión
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #f0f0f0;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 PooFriends. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
