import api from '../api/api';

export const loginAdmin = async (credenciales) => {
  try {
    const response = await api.post('/auth/login-admin', credenciales);
    return { ok: true, ...response.data };
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    const msg = error.response?.data?.msg || 'Error al iniciar sesión';
    throw { ok: false, msg };
  }
};
