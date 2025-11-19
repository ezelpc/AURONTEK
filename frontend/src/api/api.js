// src/api/api.js
import axios from "axios";

// ===============================
// 🔧 CONFIG GENERAL DEL CLIENTE
// ===============================
const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// ===============================
// 🔑 TOKENS EN LOCALSTORAGE
// ===============================
const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_KEY, token);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_KEY);

// ===============================
// 📌 AGREGAR TOKEN AUTOMÁTICAMENTE
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// ⚠️ MANEJO GLOBAL DE ERRORES
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no se ha reintentado aún
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken: getRefreshToken()
        });

        const newToken = refreshResponse.data.token;
        setToken(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló → cerrar sesión
        removeToken();
        removeRefreshToken();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// 🧩 MÉTODOS CRUD REUTILIZABLES
// ===============================
export const GET = (url, config = {}) => api.get(url, config).then((r) => r.data);
export const POST = (url, data, config = {}) => api.post(url, data, config).then((r) => r.data);
export const PUT = (url, data, config = {}) => api.put(url, data, config).then((r) => r.data);
export const PATCH = (url, data, config = {}) => api.patch(url, data, config).then((r) => r.data);
export const DELETE = (url, config = {}) => api.delete(url, config).then((r) => r.data);

// ===============================
// 📂 SUBIDA DE ARCHIVOS (GENÉRICO)
// ===============================
export const uploadFile = (url, file, extraData = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  Object.entries(extraData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }).then((r) => r.data);
};

// ===============================
// 🚀 EXPORTAR CLIENTE POR SI LO OCUPAS
// ===============================
export default api;
