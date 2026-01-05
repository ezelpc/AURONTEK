// Controllers/ticket.admin.controller.ts
import { Request, Response } from 'express';
import ticketService from '../Services/ticket.service';

/**
 * Controlador para gestión de tickets por Admin General
 */

// GET /api/tickets/admin/empresas
export const listarTicketsEmpresas = async (req: Request, res: Response) => {
    try {
        const { estado, prioridad, fechaInicio, fechaFin, usuario, folio, empresa } = req.query;

        const filtros: any = {};

        if (estado) filtros.estado = estado;
        if (prioridad) filtros.prioridad = prioridad;
        if (usuario) filtros.usuarioCreador = usuario;
        if (folio) filtros._id = folio;
        if (empresa) filtros.empresaId = empresa;

        if (fechaInicio || fechaFin) {
            filtros.createdAt = {};
            if (fechaInicio) filtros.createdAt.$gte = new Date(fechaInicio as string);
            if (fechaFin) filtros.createdAt.$lte = new Date(fechaFin as string);
        }

        const tickets = await ticketService.listarTicketsEmpresas(filtros);
        res.json(tickets);
    } catch (error: any) {
        console.error('[ADMIN] Error listando tickets empresas:', error.message);
        res.status(500).json({ msg: 'Error al listar tickets de empresas' });
    }
};

// GET /api/tickets/admin/internos
export const listarTicketsInternos = async (req: Request, res: Response) => {
    try {
        const { estado, prioridad, fechaInicio, fechaFin, usuario, folio } = req.query;

        const filtros: any = {};

        if (estado) filtros.estado = estado;
        if (prioridad) filtros.prioridad = prioridad;
        if (usuario) filtros.usuarioCreador = usuario;
        if (folio) filtros._id = folio;

        if (fechaInicio || fechaFin) {
            filtros.createdAt = {};
            if (fechaInicio) filtros.createdAt.$gte = new Date(fechaInicio as string);
            if (fechaFin) filtros.createdAt.$lte = new Date(fechaFin as string);
        }

        const tickets = await ticketService.listarTicketsInternos(filtros);
        res.json(tickets);
    } catch (error: any) {
        console.error('[ADMIN] Error listando tickets internos:', error.message);
        res.status(500).json({ msg: 'Error al listar tickets internos' });
    }
};

// GET /api/tickets/admin/globales
export const listarTicketsGlobales = async (req: Request, res: Response) => {
    console.log('✅ [ADMIN-CONTROLLER] Entrando a listarTicketsGlobales');
    try {
        const { estado, prioridad, fechaInicio, fechaFin, usuario, folio } = req.query;

        const filtros: any = {};

        if (estado) filtros.estado = estado;
        if (prioridad) filtros.prioridad = prioridad;
        if (usuario) filtros.usuarioCreador = usuario;
        if (folio) filtros._id = folio;

        if (fechaInicio || fechaFin) {
            filtros.createdAt = {};
            if (fechaInicio) filtros.createdAt.$gte = new Date(fechaInicio as string);
            if (fechaFin) filtros.createdAt.$lte = new Date(fechaFin as string);
        }

        const tickets = await ticketService.listarTicketsGlobales(filtros);
        res.json(tickets);
    } catch (error: any) {
        console.error('[ADMIN] Error listando tickets globales:', error.message);
        res.status(500).json({ msg: 'Error al listar tickets globales' });
    }
};

// GET /api/tickets/admin/:id
export const obtenerTicketDetalle = async (req: Request, res: Response) => {
    try {
        const ticket = await ticketService.obtenerTicket(req.params.id, {
            poblar: ['empresaId', 'usuarioCreador', 'agenteAsignado', 'tutor']
        });
        res.json(ticket);
    } catch (error: any) {
        console.error('[ADMIN] Error obteniendo ticket:', error.message);
        res.status(404).json({ msg: error.message });
    }
};

// PATCH /api/tickets/admin/:id/asignar
export const asignarAgente = async (req: Request, res: Response) => {
    try {
        const { agenteId, empresaId } = req.body;

        if (!agenteId || !empresaId) {
            return res.status(400).json({ msg: 'Se requiere agenteId y empresaId' });
        }

        const ticket = await ticketService.asignarTicket(req.params.id, agenteId, empresaId, req.usuario?.id || req.usuario?._id, req.usuario?.nombre);
        res.json({ msg: 'Agente asignado correctamente', ticket });
    } catch (error: any) {
        console.error('[ADMIN] Error asignando agente:', error.message);
        res.status(400).json({ msg: error.message });
    }
};

// PATCH /api/tickets/admin/:id/estado
export const cambiarEstado = async (req: Request, res: Response) => {
    try {
        const { estado, motivo } = req.body;

        if (!estado) {
            return res.status(400).json({ msg: 'Se requiere el nuevo estado' });
        }

        const ticket = await ticketService.actualizarEstado(req.params.id, estado, req.usuario?.id || req.usuario?._id, motivo, req.usuario?.nombre);
        res.json({ msg: 'Estado actualizado correctamente', ticket });
    } catch (error: any) {
        console.error('[ADMIN] Error cambiando estado:', error.message);
        res.status(400).json({ msg: error.message });
    }
};

// PATCH /api/tickets/admin/:id/prioridad
export const cambiarPrioridad = async (req: Request, res: Response) => {
    try {
        const { prioridad } = req.body;

        if (!prioridad) {
            return res.status(400).json({ msg: 'Se requiere la nueva prioridad' });
        }

        const ticket = await ticketService.cambiarPrioridad(req.params.id, prioridad, req.usuario?.id || req.usuario?._id, req.usuario?.nombre);
        res.json({ msg: 'Prioridad actualizada correctamente', ticket });
    } catch (error: any) {
        console.error('[ADMIN] Error cambiando prioridad:', error.message);
        res.status(400).json({ msg: error.message });
    }
};

export default {
    listarTicketsEmpresas,
    listarTicketsInternos,
    listarTicketsGlobales,
    obtenerTicketDetalle,
    asignarAgente,
    cambiarEstado,
    cambiarPrioridad
};
