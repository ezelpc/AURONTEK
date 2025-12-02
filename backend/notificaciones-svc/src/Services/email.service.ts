import { transporter } from '../config/smtp.config';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const result = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });

    logger.info(`📧 Correo enviado a ${to}`);
    return result;
  } catch (err) {
    logger.error('❌ Error enviando correo:', err);
    throw new Error('No se pudo enviar el correo');
  }
};