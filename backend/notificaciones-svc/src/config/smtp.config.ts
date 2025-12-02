import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

export let transporter: Transporter | null = null;

export const loadSMTP = async (): Promise<void> => {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST as string,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER as string,
                pass: process.env.EMAIL_PASSWORD as string
            }
        });

        await transporter.verify();
        logger.info('📨 SMTP listo');
    } catch (err) {
        logger.error('❌ Error al configurar SMTP', err);
        throw err;
    }
};

export const smtpVerify = async (): Promise<void> => {
    if (!transporter) {
        await loadSMTP();
    }
};