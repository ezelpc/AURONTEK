import { resendClient } from '../config/resend.config';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
  try {
    if (!resendClient) {
      throw new Error('Resend no configurado');
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Usar HTML o TEXT (HTML por defecto si hay ambos)
    const emailPayload: any = {
      from: fromEmail,
      to,
      subject
    };

    if (html) {
      emailPayload.html = html;
    } else if (text) {
      emailPayload.text = text;
    } else {
      throw new Error('Se requiere html o text en el email');
    }

    const result = await resendClient.emails.send(emailPayload);

    console.log(`📧 Correo enviado a ${to} - ID: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error enviando correo:', err);
    throw new Error(`No se pudo enviar el correo: ${(err as any)?.message || 'Error desconocido'}`);
  }
};