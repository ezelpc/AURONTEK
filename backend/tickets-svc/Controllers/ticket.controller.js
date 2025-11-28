// Controllers/ticket.controller.js
import ticketService from '../Services/ticket.service.js';
import { estadosTicket, tipos, prioridades } from '../Models/Ticket.model.js';

// Middleware para validar formato ID MongoDB
const validarMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const ticketController = {
  // POST /tickets
  async crear(req, res) {
    try {
      const datosTicket = {
        ...req.body,
        usuarioCreador: req.usuario.id,
        empresaId: req.usuario.empresaId
      };

      // Validar tipo solo si se proporcionó
      if (datosTicket.tipo && !tipos.includes(datosTicket.tipo)) {
        return res.status(400).json({
          msg: `Tipo de ticket inválido. Debe ser uno de: ${tipos.join(', ')}`
        });
      }

      // Validar prioridad solo si se proporcionó
      if (datosTicket.prioridad && !prioridades.includes(datosTicket.prioridad)) {
        return res.status(400).json({
          msg: `Prioridad inválida. Debe ser una de: ${prioridades.join(', ')}`
        });
      }

      const nuevoTicket = await ticketService.crearTicket(datosTicket);
      res.status(201).json(nuevoTicket);
    } catch (error) {
      console.error('Error al crear ticket:', error);
      res.status(500).json({ msg: 'Error al crear el ticket', error: error.message });
    }
  },

  // GET /tickets
  async listar(req, res) {
    try {
      const { pagina = 1, limite = 10, estado, prioridad, asignado } = req.query;

      // Construir filtros
      const filtros = { empresaId: req.usuario.empresaId };
      if (estado) filtros.estado = estado;
      if (prioridad) filtros.prioridad = prioridad;

      // asignado: 'true' => solo con agente asignado, 'false' => sin agente
      if (typeof asignado !== 'undefined') {
        if (asignado === 'true') filtros.agenteAsignado = { $ne: null };
        else if (asignado === 'false') filtros.agenteAsignado = null;
      }

      // Si el usuario es 'usuario' ver solo los suyos
      if (req.usuario.rol === 'usuario') {
        filtros.usuarioCreador = req.usuario.id;
      }
      // Si es 'soporte' o 'beca-soporte', ver los asignados a él
      else if (['soporte', 'beca-soporte'].includes(req.usuario.rol)) {
        filtros.agenteAsignado = req.usuario.id;
      }

      const tickets = await ticketService.listarTickets(filtros, {
        pagina,
        limite,
        ordenar: { createdAt: -1 },
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor']
      });

      res.json(tickets);
    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.status(500).json({ msg: 'Error al listar tickets', error: error.message });
    }
  },

  // GET /tickets/:id
  async obtener(req, res) {
    try {
      const { id } = req.params;

      if (!validarMongoId(id)) {
        return res.status(400).json({ msg: 'ID de ticket inválido' });
      }

      const ticket = await ticketService.obtenerTicket(id, {
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor']
      });

      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket no encontrado' });
      }

      // Verificar permisos por empresa
      if (ticket.empresaId.toString() !== req.usuario.empresaId) {
        return res.status(403).json({ msg: 'No autorizado para ver este ticket' });
      }

      // Validar acceso según rol
      const tieneAcceso = (
        req.usuario.rol === 'admin-interno' ||
        req.usuario.rol === 'admin-general' ||
        ticket.usuarioCreador._id.toString() === req.usuario.id ||
        ticket.agenteAsignado?._id.toString() === req.usuario.id ||
        ticket.tutor?._id.toString() === req.usuario.id
      );

      if (!tieneAcceso) {
        return res.status(403).json({ msg: 'No autorizado para ver este ticket' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error al obtener ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // PUT /tickets/:id/estado
  async actualizarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!validarMongoId(id)) {
        return res.status(400).json({ msg: 'ID de ticket inválido' });
      }

      if (!estadosTicket.includes(estado)) {
        return res.status(400).json({
          msg: `Estado inválido. Debe ser uno de: ${estadosTicket.join(', ')}`
        });
      }

      // Autorización: soporte, beca-soporte, admin-interno
      if (!['soporte', 'beca-soporte', 'admin-interno'].includes(req.usuario.rol)) {
        return res.status(403).json({ msg: 'No autorizado para actualizar el estado' });
      }

      const ticket = await ticketService.actualizarEstado(id, estado, req.usuario.id);
      res.json(ticket);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // PUT /tickets/:id/asignar - Asignación por Admin
  async asignar(req, res) {
    try {
      const { id } = req.params;
      const { agenteId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(agenteId)) {
        return res.status(400).json({ msg: 'ID inválido' });
      }

      if (req.usuario.rol !== 'admin-interno') {
        return res.status(403).json({ msg: 'No autorizado para asignar tickets' });
      }

      const ticket = await ticketService.asignarTicket(id, agenteId, req.usuario.empresaId);
      res.json(ticket);
    } catch (error) {
      console.error('Error al asignar ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PUT /tickets/:id/delegar - Delegación a Becario por Soporte
  async delegar(req, res) {
    try {
      const { id } = req.params;
      const { becarioId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(becarioId)) {
        return res.status(400).json({ msg: 'ID inválido' });
      }

      // Solo 'soporte' puede delegar
      if (req.usuario.rol !== 'soporte') {
        return res.status(403).json({ msg: 'Solo usuarios con rol soporte pueden delegar tickets' });
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
    } catch (error) {
      console.error('Error al delegar ticket:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: GET /tickets/:id/acceso-chat - Verificar si el chat está habilitado
  async verificarAccesoChat(req, res) {
    try {
      const { id } = req.params;

      if (!validarMongoId(id)) {
        return res.status(400).json({ msg: 'ID de ticket inválido' });
      }

      const resultado = await ticketService.verificarAccesoChat(id, req.usuario.id);
      res.json(resultado);
    } catch (error) {
      console.error('Error al verificar acceso chat:', error);
      res.status(500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PATCH /tickets/:id/clasificacion - Actualizar clasificación (IA Service)
  async actualizarClasificacion(req, res) {
    try {
      const { id } = req.params;
      const clasificacion = req.body;

      if (!validarMongoId(id)) {
        return res.status(400).json({ msg: 'ID de ticket inválido' });
      }

      // Validar que sea llamada de servicio
      const serviceName = req.headers['x-service-name'];
      if (serviceName !== 'ia-svc') {
        return res.status(403).json({ msg: 'Solo el servicio de IA puede actualizar clasificación' });
      }

      const ticket = await ticketService.actualizarClasificacion(id, clasificacion);
      res.json({ msg: 'Clasificación actualizada', ticket });
    } catch (error) {
      console.error('Error al actualizar clasificación:', error);
      res.status(500).json({ msg: error.message });
    }
  },

  // ✅ NUEVO: PUT /tickets/:id/asignar-ia - Asignación automática por IA
  async asignarIA(req, res) {
    try {
      const { id } = req.params;
      const { agenteId } = req.body;

      if (!validarMongoId(id) || !validarMongoId(agenteId)) {
        return res.status(400).json({ msg: 'ID inválido' });
      }

      // Validar que sea llamada de servicio
      const serviceName = req.headers['x-service-name'];
      if (serviceName !== 'ia-svc') {
        return res.status(403).json({ msg: 'Solo el servicio de IA puede asignar automáticamente' });
      }

      const ticket = await ticketService.asignarTicketIA(id, agenteId);
      res.json({ msg: 'Ticket asignado automáticamente', ticket });
    } catch (error) {
      console.error('Error al asignar ticket (IA):', error);
      res.status(500).json({ msg: error.message });
    }
  }
};

export default ticketController;