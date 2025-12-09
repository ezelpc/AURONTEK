import { useState, useEffect, useCallback } from 'react';
import * as notificacionesService from '../services/notificacionesService';

/**
 * Hook personalizado para gestión de notificaciones
 * Proporciona lista de notificaciones, contador de no leídas y funciones de gestión
 */
export const useNotifications = (autoRefresh = true, refreshInterval = 30000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await notificacionesService.obtenerNotificaciones();
      setNotifications(data.notificaciones || data);
      
      // Calcular no leídas
      const unread = (data.notificaciones || data).filter(n => !n.leida).length;
      setUnreadCount(unread);
      
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar notificaciones');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadNotifications]);

  // Marcar como leída
  const markAsRead = useCallback(async (id) => {
    try {
      await notificacionesService.marcarLeida(id);
      
      // Actualizar localmente
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, leida: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificacionesService.marcarTodasLeidas();
      
      // Actualizar localmente
      setNotifications(prev => 
        prev.map(n => ({ ...n, leida: true }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // Agregar nueva notificación (para uso con WebSocket)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.leida) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n._id === id);
      if (notification && !notification.leida) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n._id !== id);
    });
  }, []);

  // Obtener solo no leídas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.leida);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    getUnreadNotifications,
    refresh: loadNotifications,
  };
};

export default useNotifications;
