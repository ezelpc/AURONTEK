import axios from 'axios';

/**
 * Verifica el token de reCAPTCHA con Google
 * @param {string} token - Token de respuesta de reCAPTCHA
 * @returns {Promise<boolean>} - true si es válido, false si no
 */
export const verificarRecaptcha = async (token: string) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY no está configurada');
    }

    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await axios.post(url, params);

    if (!response.data.success) {
      console.log('Error de reCAPTCHA:', response.data['error-codes']);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Error al verificar reCAPTCHA:', error.message);
    return false;
  }
};
export default { verificarRecaptcha };