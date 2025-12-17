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
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Error CRÍTICO al configurar SMTP (Producción)', err);
            throw err;
        } else {
            const errorMessage = (err as any).message || 'Error desconocido';
            console.warn('⚠️  ADVERTENCIA: Falló la conexión SMTP. El servicio de notificaciones iniciará sin envío de correos.', errorMessage);
            transporter = null; // Ensure null so service checks fail gracefully
        }
    }
};

export const smtpVerify = async (): Promise<void> => {
    if (!transporter) {
        await loadSMTP();
    }
};