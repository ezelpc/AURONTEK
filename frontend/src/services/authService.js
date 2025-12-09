// src/services/authService.js
import api, { setToken, setRefreshToken, removeToken, removeRefreshToken } from '../api/api';

const AUTH_BASE = '/auth';

/**
 * Servicio de autenticación
 */
const authService = {
  /**
   * Iniciar sesión
   * @param {Object} credentials - { correo, contraseña, captchaToken }
   */
  login: async (credentials) => {
    try {
      const response = await api.post(`${AUTH_BASE}/login`, credentials);
      const data = response.data;

      if (data.token) {
        setToken(data.token);
        
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }

        // Guardar usuario
        const usuario = data.usuario || data.user || data.admin;
        if (usuario) {
          localStorage.setItem('user', JSON.stringify(usuario));
        }
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Validar código de acceso (para empresas)
   * @param {string} codigoAcceso - Código de acceso de la empresa
   */
  validarCodigoAcceso: async (codigoAcceso) => {
    try {
      const response = await api.post(`${AUTH_BASE}/validate-code`, { codigoAcceso });
      return response.data;
    } catch (error) {
      console.error('Error validando código:', error);
      throw error;
    }
  },

  /**
   * Cerrar sesión
   */
  logout: async () => {
    try {
      await api.post(`${AUTH_BASE}/logout`);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar tokens y usuario
      removeToken();
      removeRefreshToken();
      localStorage.removeItem('user');
    }
  },

  /**
   * Verificar sesión actual
   */
  checkSession: async () => {
    try {
      const response = await api.get(`${AUTH_BASE}/check`);
      return response.data;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      throw error;
    }
  },

  /**
   * Registrar nuevo usuario (solo admin)
   * @param {Object} userData - Datos del usuario
   */
  register: async (userData) => {
    try {
      const response = await api.post(`${AUTH_BASE}/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  /**
   * Solicitar recuperación de contraseña
   * @param {string} correo - Correo del usuario
   */
  forgotPassword: async (correo) => {
    try {
      const response = await api.post(`${AUTH_BASE}/forgot-password`, { correo });
      return response.data;
    } catch (error) {
      console.error('Error solicitando recuperación:', error);
      throw error;
    }
  },

  /**
   * Restablecer contraseña
   * @param {string} token - Token de recuperación
   * @param {string} nuevaContraseña - Nueva contraseña
   */
  resetPassword: async (token, nuevaContraseña) => {
    try {
      const response = await api.post(`${AUTH_BASE}/reset-password`, {
        token,
        nuevaContraseña,
      });
      return response.data;
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      throw error;
    }
  },

  /**
   * Obtener usuario actual desde localStorage
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    const user = authService.getCurrentUser();
    return !!(token && user);
  },
};

export default authService;

// Exportar funciones individuales para compatibilidad
export const login = authService.login;
export const logout = authService.logout;
export const checkSession = authService.checkSession;
export const getCurrentUser = authService.getCurrentUser;
export const isAuthenticated = authService.isAuthenticated;