import { resendClient } from '../config/resend.config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    if (!resendClient) {
      throw new Error('Resend no configurado');
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const result = await resendClient.emails.send({
      from: fromEmail,
      to,
      subject,
      html
    });

    console.log(`📧 Correo enviado a ${to} - ID: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error enviando correo:', err);
    throw new Error('No se pudo enviar el correo');
  }
};