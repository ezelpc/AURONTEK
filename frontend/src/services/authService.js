// src/services/authService.js
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/admin-sistema/login`;

/**
 * Inicia sesión y guarda credenciales según "mantener sesión"
 * @param {string} correo
 * @param {string} contraseña
 * @param {string} captchaToken
 * @param {boolean} mantenerSesion
 */
export const login = async (correo, contraseña, captchaToken, mantenerSesion = false) => {
  try {
    const response = await axios.post(API_URL, {
      correo,
      contraseña,
      captchaToken,
    });
    const data = response.data;
    if (data.ok && data.token) {
      const storage = mantenerSesion ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      storage.setItem('admin', JSON.stringify(data.admin));
    }
    return data;
  } catch (error) {
    return { ok: false, error: error?.response?.data?.error || 'Error de conexión' };
  }
};