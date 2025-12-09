import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

/**
 * Hook personalizado para manejo de autenticación
 * Proporciona estado del usuario, funciones de login/logout y verificación de permisos
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      
      const userData = response.usuario || response.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/acceso-empresa');
    }
  }, [navigate]);

  // Verificar si el usuario tiene un rol específico
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const userRole = user.rol || user.role;
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  }, [user]);

  // Verificar si es admin
  const isAdmin = useCallback(() => {
    return hasRole(['Admin', 'superadmin', 'admin-interno']);
  }, [hasRole]);

  // Verificar si es admin de empresa
  const isAdminEmpresa = useCallback(() => {
    return hasRole('admin_empresa');
  }, [hasRole]);

  // Verificar si es soporte
  const isSoporte = useCallback(() => {
    return hasRole(['soporte', 'beca-soporte']);
  }, [hasRole]);

  // Actualizar usuario
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    isAdmin,
    isAdminEmpresa,
    isSoporte,
    updateUser,
    isAuthenticated: !!user,
  };
};

export default useAuth;
