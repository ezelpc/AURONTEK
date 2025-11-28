import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';


export let transporter;


export const loadSMTP = async () => {
try {
transporter = nodemailer.createTransport({
host: process.env.EMAIL_HOST,
port: Number(process.env.EMAIL_PORT),
secure: process.env.EMAIL_SECURE === 'true',
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASSWORD
}
});


await transporter.verify();
logger.info('📨 SMTP listo');
} catch (err) {
logger.error('❌ Error al configurar SMTP', err);
throw err;
}
};
export const smtpVerify = async () => {
if (!transporter) {
await loadSMTP();
}       
};