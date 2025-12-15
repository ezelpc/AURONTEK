import { useState, useEffect, useCallback } from 'react';
import ticketService from '../services/ticketService';

/**
 * Hook personalizado para gestión de tickets
 * Proporciona funciones CRUD, filtros y cache local
 */
export const useTickets = (initialFilters = {}) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Cargar tickets
  const loadTickets = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const finalFilters = { ...filters, ...customFilters };
      const response = await ticketService.listarTickets(finalFilters);
      
      setTickets(response.tickets || response.data || response);
      
      if (response.pagination) {
        setPagination(response.pagination);
      }
      
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar tickets');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Cargar tickets al montar o cuando cambien los filtros
  useEffect(() => {
    loadTickets();
  }, [filters.estado, filters.prioridad, filters.agenteId]); // Solo recargar en cambios importantes

  // Obtener un ticket por ID
  const getTicket = useCallback(async (id) => {
    try {
      setLoading(true);
      const ticket = await ticketService.obtenerTicket(id);
      return ticket;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear ticket
  const createTicket = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const newTicket = await ticketService.crearTicket(data);
      
      // Agregar al inicio de la lista
      setTickets(prev => [newTicket, ...prev]);
      
      return newTicket;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar estado de ticket
  const updateTicketStatus = useCallback(async (id, estado, comentario) => {
    try {
      setLoading(true);
      const updated = await ticketService.actualizarEstado(id, estado, comentario);
      
      // Actualizar en la lista local
      setTickets(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t));
      
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Asignar ticket
  const assignTicket = useCallback(async (id, agenteId) => {
    try {
      setLoading(true);
      const updated = await ticketService.asignarTicket(id, agenteId);
      
      // Actualizar en la lista local
      setTickets(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t));
      
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asignar ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delegar ticket
  const delegateTicket = useCallback(async (id, becarioId) => {
    try {
      setLoading(true);
      const updated = await ticketService.delegarTicket(id, becarioId);
      
      // Actualizar en la lista local
      setTickets(prev => prev.map(t => t._id === id ? { ...t, ...updated } : t));
      
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al delegar ticket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Refrescar tickets
  const refresh = useCallback(() => {
    return loadTickets();
  }, [loadTickets]);

  return {
    tickets,
    loading,
    error,
    filters,
    pagination,
    loadTickets,
    getTicket,
    createTicket,
    updateTicketStatus,
    assignTicket,
    delegateTicket,
    updateFilters,
    clearFilters,
    refresh,
  };
};

export default useTickets;
