import { Request, Response } from 'express';
import ticketService from '../Services/ticket.service';
import { estadosTicket, tipos, prioridades } from '../Models/Ticket.model';

// Middleware para validar formato ID MongoDB
const validarMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const ticketController = {
  // POST /tickets
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const datosTicket = {
        ...req.body,
        usuarioCreador: req.usuario?.id,
        empresaId: req.usuario?.empresaId
      };

      // Validar tipo solo si se proporcionó
      if (datosTicket.tipo && !tipos.includes(datosTicket.tipo)) {
        res.status(400).json({
          msg: `Tipo de ticket inválido. Debe ser uno de: ${tipos.join(', ')}`
        });
        return;
      }

      // Validar prioridad solo si se proporcionó
      if (datosTicket.prioridad && !prioridades.includes(datosTicket.prioridad)) {
        res.status(400).json({
          msg: `Prioridad inválida. Debe ser una de: ${prioridades.join(', ')}`
        });
        return;
      }

      const nuevoTicket = await ticketService.crearTicket(datosTicket);
      res.status(201).json(nuevoTicket);
    } catch (error: any) {
      console.error('Error al crear ticket:', error);
      res.status(500).json({ msg: 'Error al crear el ticket', error: error.message });
    }
  },

  // GET /tickets
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { pagina = 1, limite = 10, estado, prioridad, asignado } = req.query;

      // Construir filtros
      const filtros: any = { empresaId: req.usuario?.empresaId };
      if (estado) filtros.estado = estado;
      if (prioridad) filtros.prioridad = prioridad;

      // asignado: 'true' => solo con agente asignado, 'false' => sin agente
      if (typeof asignado !== 'undefined') {
        if (asignado === 'true') filtros.agenteAsignado = { $ne: null };
        else if (asignado === 'false') filtros.agenteAsignado = null;
      }

      // Si el usuario es 'usuario' ver solo los suyos
      if (req.usuario?.rol === 'usuario') {
        filtros.usuarioCreador = req.usuario.id;
      }
      // Si es 'soporte' o 'beca-soporte', ver los asignados a él
      else if (['soporte', 'beca-soporte'].includes(req.usuario?.rol || '')) {
        filtros.agenteAsignado = req.usuario?.id;
      }

      const tickets = await ticketService.listarTickets(filtros, {
        pagina: Number(pagina),
        limite: Number(limite),
        ordenar: { createdAt: -1 },
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor']
      });

      res.json(tickets);
    } catch (error: any) {
      console.error('Error al listar tickets:', error);
      res.status(500).json({ msg: 'Error al listar tickets', error: error.message });
    }
  },

  // GET /tickets/:id
  async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID de ticket inválido' });
        return;
      }

      const ticket: any = await ticketService.obtenerTicket(id, {
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor']
      });

      if (!ticket) {
        res.status(404).json({ msg: 'Ticket no encontrado' });
        return;
      }

      // Verificar permisos por empresa
      if (ticket.empresaId.toString() !== req.usuario?.empresaId) {
        res.status(403).json({ msg: 'No autorizado para ver este ticket' });
        return;
      }

      // Validar acceso según rol
      const tieneAcceso = (
        req.usuario?.rol === 'admin-interno' ||
        req.usuario?.rol === 'admin-general' ||
        ticket.usuarioCreador?._id?.toString() === req.usuario?.id ||
        ticket.agenteAsignado?._id?.toString() === req.usuario?.id ||
        ticket.tutor?._id?.toString() === req.usuario?.id
      );

      if (!tieneAcceso) {
        res.status(403).json({ msg: 'No autorizado para ver este ticket' });
        return;
      }

      res.json(ticket);
    } catch (error: any) {
      console.error('Error al obtener ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // PUT /tickets/:id/estado
  async actualizarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID de ticket inválido' });
        return;
      }

      if (!estadosTicket.includes(estado)) {
        res.status(400).json({
          msg: `Estado inválido. Debe ser uno de: ${estadosTicket.join(', ')}`
        });
        return;
      }

      // Autorización: soporte, beca-soporte, admin-interno
      if (!['soporte', 'beca-soporte', 'admin-interno'].includes(req.usuario?.rol || '')) {
        res.status(403).json({ msg: 'No autorizado para actualizar el estado' });
        return;
      }

      const ticket = await ticketService.actualizarEstado(id, estado, req.usuario?.id);
      res.json(ticket);
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // PUT /tickets/:id/asignar - Asignación por Admin
  async asignar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { agenteId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(agenteId)) {
        res.status(400).json({ msg: 'ID inválido' });
        return;
      }

      if (!req.usuario) {
        res.status(401).json({ msg: 'Usuario no autenticado' });
        return;
      }

      if (req.usuario.rol !== 'admin-interno') {
        res.status(403).json({ msg: 'No autorizado para asignar tickets' });
        return;
      }

      const ticket = await ticketService.asignarTicket(id, agenteId, req.usuario.empresaId);
      res.json(ticket);
    } catch (error: any) {
      console.error('Error al asignar ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PUT /tickets/:id/delegar - Delegación a Becario por Soporte
  async delegar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { becarioId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(becarioId)) {
        res.status(400).json({ msg: 'ID inválido' });
        return;
      }

      if (!req.usuario) {
        res.status(401).json({ msg: 'Usuario no autenticado' });
        return;
      }

      // Solo 'soporte' puede delegar
      if (req.usuario.rol !== 'soporte') {
        res.status(403).json({ msg: 'Solo usuarios con rol soporte pueden delegar tickets' });
        return;
      }

      const ticket = await ticketService.delegarTicket(
        id,
        becarioId,
        req.usuario.id, // El soporte actual se convierte en tutor
        req.usuario.empresaId
      );

      res.json({
        msg: 'Ticket delegado exitosamente',
        ticket
      });
    } catch (error: any) {
      console.error('Error al delegar ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: GET /tickets/:id/acceso-chat - Verificar si el chat está habilitado
  async verificarAccesoChat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID de ticket inválido' });
        return;
      }

      const resultado = await ticketService.verificarAccesoChat(id, req.usuario?.id);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al verificar acceso chat:', error);
      res.status(500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PATCH /tickets/:id/clasificacion - Actualizar clasificación (IA Service)
  async actualizarClasificacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const clasificacion = req.body;

      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID de ticket inválido' });
        return;
      }

      // Validar que sea llamada de servicio
      const serviceName = req.headers['x-service-name'];
      if (serviceName !== 'ia-svc') {
        res.status(403).json({ msg: 'Solo el servicio de IA puede actualizar clasificación' });
        return;
      }

      const ticket = await ticketService.actualizarClasificacion(id, clasificacion);
      res.json({ msg: 'Clasificación actualizada', ticket });
    } catch (error: any) {
      console.error('Error al actualizar clasificación:', error);
      res.status(500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PUT /tickets/:id/asignar-ia - Asignación automática por IA
  async asignarIA(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { agenteId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(agenteId)) {
        res.status(400).json({ msg: 'ID inválido' });
        return;
      }

      // Validar que sea llamada de servicio
      const serviceName = req.headers['x-service-name'];
      if (serviceName !== 'ia-svc') {
        res.status(403).json({ msg: 'Solo el servicio de IA puede asignar automáticamente' });
        return;
      }

      const ticket = await ticketService.asignarTicketIA(id, agenteId);
      res.json({ msg: 'Ticket asignado automáticamente', ticket });
    } catch (error: any) {
      console.error('Error al asignar ticket (IA):', error);
      res.status(500).json({ msg: error.message });
    }
  }
};

export default ticketController;