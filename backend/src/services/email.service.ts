import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM || 'contact@infomania.store';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'contact@infomania.store';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ecomcookpit.site';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  verificationToken: string;
}

export const emailService = {
  async sendVerificationEmail({ to, name, verificationToken }: SendVerificationEmailParams) {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      const { data, error } = await getResendClient().emails.send({
        from: EMAIL_FROM,
        to,
        reply_to: EMAIL_REPLY_TO,
        subject: 'Vérifiez votre adresse email - ZeChat.site',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Vérification Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111111; border: 1px solid #1e1e1e; border-radius: 16px; overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0d2510 0%, #111111 100%);">
                          <h1 style="margin: 0; color: #22c55e; font-size: 28px; font-weight: 700;">
                            ✨ Bienvenue sur ZeChat.site
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding: 30px 40px;">
                          <p style="margin: 0 0 20px; color: #e8e8e8; font-size: 16px; line-height: 1.6;">
                            Bonjour <strong style="color: #22c55e;">${name}</strong>,
                          </p>
                          
                          <p style="margin: 0 0 20px; color: #a8a8a8; font-size: 15px; line-height: 1.6;">
                            Merci de vous être inscrit ! Pour commencer à utiliser votre compte et accéder à toutes les fonctionnalités de notre plateforme WhatsApp Business, veuillez vérifier votre adresse email.
                          </p>
                          
                          <p style="margin: 0 0 30px; color: #a8a8a8; font-size: 15px; line-height: 1.6;">
                            Cliquez sur le bouton ci-dessous pour activer votre compte :
                          </p>
                          
                          <!-- CTA Button -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 10px 0 30px;">
                                <a href="${verificationUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
                                  Vérifier mon email
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
                            Ou copiez ce lien dans votre navigateur :
                          </p>
                          <p style="margin: 0 0 30px; color: #22c55e; font-size: 13px; word-break: break-all;">
                            ${verificationUrl}
                          </p>
                          
                          <div style="background-color: #1a1a1a; border-left: 3px solid #22c55e; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #a8a8a8; font-size: 13px; line-height: 1.5;">
                              <strong style="color: #22c55e;">⏱️ Important :</strong> Ce lien est valide pendant 24 heures. Si vous ne vérifiez pas votre email dans ce délai, vous devrez demander un nouveau lien.
                            </p>
                          </div>
                          
                          <p style="margin: 0; color: #6a6a6a; font-size: 13px; line-height: 1.5;">
                            Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px 40px; background-color: #0d0d0d; border-top: 1px solid #1e1e1e;">
                          <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 12px; text-align: center;">
                            © 2026 ZeChat.site - L'outil WhatsApp des e-commerçants ambitieux
                          </p>
                          <p style="margin: 0; color: #4a4a4a; font-size: 11px; text-align: center;">
                            Cet email a été envoyé à ${to}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Erreur Resend:', error);
        throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
      }

      console.log('✅ Email de vérification envoyé:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  },

  async sendWelcomeEmail({ to, name }: { to: string; name: string }) {
    try {
      const { data, error } = await getResendClient().emails.send({
        from: EMAIL_FROM,
        to,
        reply_to: EMAIL_REPLY_TO,
        subject: '🎉 Bienvenue sur ZeChat.site !',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111111; border: 1px solid #1e1e1e; border-radius: 16px;">
                      <tr>
                        <td style="padding: 40px; text-align: center;">
                          <h1 style="margin: 0 0 20px; color: #22c55e; font-size: 32px;">🎉</h1>
                          <h2 style="margin: 0 0 20px; color: #e8e8e8; font-size: 24px;">Votre compte est activé !</h2>
                          <p style="margin: 0 0 30px; color: #a8a8a8; font-size: 16px; line-height: 1.6;">
                            Bonjour <strong style="color: #22c55e;">${name}</strong>,<br><br>
                            Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de ZeChat.site.
                          </p>
                          <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #22c55e; color: #000; text-decoration: none; font-weight: 600; padding: 14px 40px; border-radius: 10px;">
                            Accéder au tableau de bord
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Erreur Resend (welcome):', error);
        throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
      }

      console.log('✅ Email de bienvenue envoyé:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      throw error;
    }
  },
};
