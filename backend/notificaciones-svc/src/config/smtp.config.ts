import nodemailer, { Transporter } from 'nodemailer';

export let transporter: Transporter | null = null;

export const loadSMTP = async (): Promise<void> => {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASSWORD,
            }
        });

        await transporter.verify();
        console.log('📨 SMTP listo');
    } catch (err) {
        console.error('❌ Error al configurar SMTP', err);
        throw err;
    }
};

export const smtpVerify = async (): Promise<void> => {
    if (!transporter) {
        await loadSMTP();
    }
};