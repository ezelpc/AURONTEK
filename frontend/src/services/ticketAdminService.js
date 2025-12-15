import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Servicio para gestión de tickets - Admin General
 */

// Obtener tickets de empresas (sin Aurontek HQ)
export const getTicketsEmpresas = async (filtros = {}) => {
  const params = new URLSearchParams();
  
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
  if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
  if (filtros.usuario) params.append('usuario', filtros.usuario);
  if (filtros.folio) params.append('folio', filtros.folio);
  if (filtros.empresa) params.append('empresa', filtros.empresa);
  
  const response = await api.get(`/tickets/admin/empresas?${params.toString()}`);
  return response.data;
};

// Obtener tickets internos (solo Aurontek HQ)
export const getTicketsInternos = async (filtros = {}) => {
  const params = new URLSearchParams();
  
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
  if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
  if (filtros.usuario) params.append('usuario', filtros.usuario);
  if (filtros.folio) params.append('folio', filtros.folio);
  
  const response = await api.get(`/tickets/admin/internos?${params.toString()}`);
  return response.data;
};

// Obtener detalle de un ticket
export const getTicketDetalle = async (id) => {
  const response = await api.get(`/tickets/admin/${id}`);
  return response.data;
};

// Asignar agente a un ticket
export const asignarAgente = async (ticketId, agenteId, empresaId) => {
  const response = await api.patch(`/tickets/admin/${ticketId}/asignar`, {
    agenteId,
    empresaId
  });
  return response.data;
};

// Cambiar estado de un ticket
export const cambiarEstado = async (ticketId, estado) => {
  const response = await api.patch(`/tickets/admin/${ticketId}/estado`, {
    estado
  });
  return response.data;
};

// Cambiar prioridad de un ticket
export const cambiarPrioridad = async (ticketId, prioridad) => {
  const response = await api.patch(`/tickets/admin/${ticketId}/prioridad`, {
    prioridad
  });
  return response.data;
};

export default {
  getTicketsEmpresas,
  getTicketsInternos,
  getTicketDetalle,
  asignarAgente,
  cambiarEstado,
  cambiarPrioridad
};
