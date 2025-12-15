// Services/ticket.service.ts
import Ticket from '../Models/Ticket.model';
import amqp from 'amqplib';
import axios from 'axios';
import mongoose from 'mongoose';

class TicketService {
  channel: any = null;
  connection: any = null;
  exchange = 'tickets';
  _connecting = false;

  constructor() {
    this.initializeRabbitMQ();
  }

  async initializeRabbitMQ() {
    if (this._connecting) return;
    this._connecting = true;

    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    let attempt = 0;
    const MAX_ATTEMPTS = 3; // Limitar intentos

    const connectWithRetry = async (): Promise<void> => {
      attempt++;

      if (attempt > MAX_ATTEMPTS) {
        console.warn(`⚠️  No se pudo conectar a RabbitMQ después de ${MAX_ATTEMPTS} intentos. Continuando sin RabbitMQ...`);
        this._connecting = false;
        return;
      }

      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createConfirmChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

        this.connection.on('error', (err: any) => {
          console.error('RabbitMQ connection error:', err);
        });

        this.connection.on('close', () => {
          console.warn('RabbitMQ conexión cerrada.');
          this.channel = null;
          this.connection = null;
          this._connecting = false;
        });

        console.log('✅ Conexión establecida con RabbitMQ');
        this._connecting = false;
      } catch (err) {
        console.error(`Error al conectar con RabbitMQ (intento ${attempt}/${MAX_ATTEMPTS}):`, err);
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(connectWithRetry, 1000);
        } else {
          console.warn('⚠️  RabbitMQ no disponible. Las funciones de mensajería estarán deshabilitadas.');
          this._connecting = false;
        }
      }
    };

    connectWithRetry();
  }

  async publicarEvento(routingKey: string, data: any) {
    if (!this.channel) {
      console.warn(`⚠️  No hay conexión con RabbitMQ. Evento '${routingKey}' no publicado.`);
      return; // No lanzar error, solo advertir
    }

    try {
      const payload = Buffer.from(JSON.stringify(data));
      this.channel.publish(this.exchange, routingKey, payload, { persistent: true }, (err: any, ok: any) => {
        if (err) {
          console.error('Publish error:', err);
        } else {
          console.log(`Evento publicado: ${routingKey}`);
        }
      });
    } catch (error) {
      console.error('Error al publicar evento:', error);
      // No lanzar error, solo registrar
    }
  }

  // ✅ Validar que un usuario tenga las habilidades necesarias
  async validarHabilidadesAgente(agenteId: string, empresaId: string) {
    try {
      const response = await axios.get(
        `${process.env.USUARIOS_SVC_URL}/usuarios/${agenteId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
            'X-Service-Name': 'tickets-svc'
          }
        }
      );

      const agente = response.data;

      // Validar que pertenezca a la empresa
      if (agente.empresa.toString() !== empresaId.toString()) {
        throw new Error('El agente no pertenece a la empresa del ticket');
      }

      // Validar que sea soporte, beca-soporte o admin-interno (para tickets de IT/Sistema)
      if (!['soporte', 'beca-soporte', 'admin-interno'].includes(agente.rol)) {
        throw new Error('El usuario asignado debe tener rol de soporte, beca-soporte o admin-interno');
      }

      return agente;
    } catch (error: any) {
      console.error('Error validando agente:', error.message);
      throw new Error('No se pudo validar el agente: ' + error.message);
    }
  }

  async crearTicket(datosTicket: any) {
    try {
      const nuevoTicket: any = await (Ticket as any).create(datosTicket);

      // Publicar evento para que la IA lo analice y sugiera asignación
      const eventPayload = {
        ticket: {
          id: nuevoTicket._id.toString(),
          titulo: nuevoTicket.titulo,
          descripcion: nuevoTicket.descripcion,
          empresaId: nuevoTicket.empresaId.toString(),
          usuarioCreador: nuevoTicket.usuarioCreador?.toString(),
          servicioNombre: nuevoTicket.servicioNombre || null,
          tipo: nuevoTicket.tipo || null,
          prioridad: nuevoTicket.prioridad || null,
          categoria: nuevoTicket.categoria || null,
          etiquetas: nuevoTicket.etiquetas || []
        }
      };

      try {
        await this.publicarEvento('ticket.creado', eventPayload);
      } catch (pubErr: any) {
        console.error('No se pudo publicar evento ticket.creado:', pubErr.message || pubErr);
      }

      return nuevoTicket;
    } catch (error) {
      console.error('Error al crear ticket:', error);
      throw error;
    }
  }

  async listarTickets(filtros: any = {}, options: any = {}) {
    const { pagina = 1, limite = 10, ordenar = { createdAt: -1 }, poblar = [] } = options;
    const skip = (Number(pagina) - 1) * Number(limite);
    let query: any = (Ticket as any).find(filtros).sort(ordenar).skip(skip).limit(Number(limite));
    poblar.forEach((p: string) => query = query.populate(p, 'nombre correo rol'));
    const docs = await query.exec();
    const total = await (Ticket as any).countDocuments(filtros);
    return { data: docs, pagina: Number(pagina), limite: Number(limite), total };
  }

  async obtenerTicket(id: string, options: any = {}) {
    let q: any = (Ticket as any).findById(id);
    (options.poblar || []).forEach((p: string) => (q = q.populate(p, 'nombre correo rol')));
    const ticket = await q.exec();
    if (!ticket) throw new Error('Ticket no encontrado');
    return ticket;
  }

  async actualizarEstado(id: string, estado: string, usuarioId?: string) {
    const ticket: any = await (Ticket as any).findById(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    const estadoAnterior = ticket.estado;
    ticket.estado = estado as any;

    // Actualizar fechas según el estado
    if (estado === 'en_proceso' && !ticket.fechaRespuesta) {
      ticket.fechaRespuesta = new Date();
    }
    if (estado === 'resuelto' && !ticket.fechaResolucion) {
      ticket.fechaResolucion = new Date();
    }

    await ticket.save();

    // Publicar evento
    try {
      await this.publicarEvento('ticket.estado_actualizado', {
        ticket: {
          id: ticket._id.toString(),
          estado,
          estadoAnterior,
          actualizadoPor: usuarioId
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar estado actualizado:', e.message || e);
    }

    return ticket;
  }

  async asignarTicket(id: string, agenteId: string, empresaId: string) {
    const ticket: any = await (Ticket as any).findById(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Validar habilidades del agente
    const agente = await this.validarHabilidadesAgente(agenteId, empresaId);

    ticket.agenteAsignado = new mongoose.Types.ObjectId(agenteId);

    // Si el ticket está en 'abierto', cambiarlo a 'en_proceso'
    if (ticket.estado === 'abierto') {
      ticket.estado = 'en_proceso';
      ticket.fechaRespuesta = new Date();
    }

    await ticket.save();

    try {
      await this.publicarEvento('ticket.asignado', {
        ticket: {
          id: ticket._id.toString(),
          agenteId: agenteId.toString(),
          agenteNombre: agente.nombre,
          estado: ticket.estado
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar ticket.asignado:', e.message || e);
    }

    return ticket;
  }

  // ✅ NUEVO: Delegar ticket a becario (el soporte se vuelve tutor)
  async delegarTicket(ticketId: string, becarioId: string, tutorId: string, empresaId: string) {
    const ticket: any = await (Ticket as any).findById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Validar que el becario sea beca-soporte
    const becario = await this.validarHabilidadesAgente(becarioId, empresaId);
    if (becario.rol !== 'beca-soporte') {
      throw new Error('Solo se puede delegar a usuarios con rol beca-soporte');
    }

    // El ticket debe estar asignado al soporte que está delegando
    if (ticket.agenteAsignado?.toString() !== tutorId) {
      throw new Error('Solo puedes delegar tickets que estén asignados a ti');
    }

    // Guardar el soporte actual como tutor
    ticket.tutor = new mongoose.Types.ObjectId(tutorId);
    // Asignar al becario
    ticket.agenteAsignado = new mongoose.Types.ObjectId(becarioId);

    await ticket.save();

    try {
      await this.publicarEvento('ticket.delegado', {
        ticket: {
          id: ticket._id.toString(),
          becarioId: becarioId.toString(),
          tutorId: tutorId.toString(),
          becarioNombre: becario.nombre
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar ticket.delegado:', e.message || e);
    }

    return ticket;
  }

  // ✅ NUEVO: Verificar si el chat está habilitado para este ticket
  async verificarAccesoChat(ticketId: string, usuarioId?: string) {
    const ticket: any = await (Ticket as any).findById(ticketId)
      .populate('usuarioCreador', '_id')
      .populate('agenteAsignado', '_id')
      .populate('tutor', '_id');

    if (!ticket) throw new Error('Ticket no encontrado');

    // El chat solo está habilitado en estados: en_proceso, en_espera
    const chatHabilitado = ['en_proceso', 'en_espera'].includes(ticket.estado);

    if (!chatHabilitado) {
      return {
        acceso: false,
        mensaje: `El chat solo está disponible cuando el ticket está en proceso o en espera. Estado actual: ${ticket.estado}`
      };
    }

    // Verificar si el usuario tiene acceso
    const tieneAcceso = (
      ticket.usuarioCreador?._id.toString() === usuarioId ||
      ticket.agenteAsignado?._id.toString() === usuarioId ||
      ticket.tutor?._id.toString() === usuarioId
    );

    return {
      acceso: tieneAcceso,
      chatHabilitado: true,
      ticket: {
        id: ticket._id,
        estado: ticket.estado,
        titulo: ticket.titulo
      }
    };
  }

  // ✅ NUEVO: Actualizar clasificación del ticket (desde IA)
  async actualizarClasificacion(ticketId: string, clasificacion: any) {
    const ticket: any = await (Ticket as any).findById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Actualizar campos de clasificación
    if (clasificacion.tipo) ticket.tipo = clasificacion.tipo;
    if (clasificacion.prioridad) ticket.prioridad = clasificacion.prioridad;
    if (clasificacion.categoria) ticket.categoria = clasificacion.categoria;
    if (clasificacion.tiempoResolucion) ticket.tiempoResolucion = clasificacion.tiempoResolucion;
    if (clasificacion.tiempoRespuesta) ticket.tiempoRespuesta = clasificacion.tiempoRespuesta;

    // Calcular fechas límite basadas en SLA
    if (ticket.tiempoRespuesta) {
      ticket.fechaLimiteRespuesta = new Date(Date.now() + ticket.tiempoRespuesta * 60000);
    }
    if (ticket.tiempoResolucion) {
      ticket.fechaLimiteResolucion = new Date(Date.now() + ticket.tiempoResolucion * 60000);
    }

    await ticket.save();

    try {
      await this.publicarEvento('ticket.clasificado', {
        ticket: {
          id: ticket._id.toString(),
          tipo: ticket.tipo,
          prioridad: ticket.prioridad,
          categoria: ticket.categoria
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar ticket.clasificado:', e.message);
    }

    return ticket;
  }

  // ✅ NUEVO: Asignar ticket automáticamente (desde IA)
  async asignarTicketIA(ticketId: string, agenteId: string) {
    const ticket: any = await (Ticket as any).findById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Validar que el agente existe (se hace en agent_assigner)
    ticket.agenteAsignado = new mongoose.Types.ObjectId(agenteId);

    // Cambiar estado si está en 'abierto'
    if (ticket.estado === 'abierto') {
      ticket.estado = 'en_proceso';
      ticket.fechaRespuesta = new Date();
    }

    await ticket.save();

    try {
      await this.publicarEvento('ticket.asignado_automaticamente', {
        ticket: {
          id: ticket._id.toString(),
          agenteId: agenteId.toString(),
          estado: ticket.estado
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar ticket.asignado_automaticamente:', e.message);
    }

    return ticket;
  }

  // ==========================================
  // MÉTODOS PARA ADMIN GENERAL
  // ==========================================

  async obtenerAurontekHQId(): Promise<string | null> {
    try {
      const response = await axios.get(
        `${process.env.USUARIOS_SVC_URL}/empresas`,
        { headers: { 'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`, 'X-Service-Name': 'tickets-svc' } }
      );
      const empresas = response.data;
      const aurontekHQ = empresas.find((emp: any) =>
        emp.nombre?.toLowerCase().includes('aurontek') && emp.nombre?.toLowerCase().includes('hq')
      );
      return aurontekHQ?._id || null;
    } catch (error) {
      console.error('Error obteniendo Aurontek HQ ID:', error);
      return null;
    }
  }

  async listarTicketsEmpresas(filtros: any = {}) {
    const aurontekHQId = await this.obtenerAurontekHQId();
    const query: any = { ...filtros };
    if (aurontekHQId) query.empresaId = { $ne: aurontekHQId };
    return await (Ticket as any).find(query)
      .populate('empresaId', 'nombre rfc')
      .populate('usuarioCreador', 'nombre correo')
      .populate('agenteAsignado', 'nombre correo rol')
      .populate('tutor', 'nombre correo')
      .sort({ createdAt: -1 }).exec();
  }

  async listarTicketsInternos(filtros: any = {}) {
    const aurontekHQId = await this.obtenerAurontekHQId();
    if (!aurontekHQId) return [];
    const query: any = { ...filtros, empresaId: aurontekHQId };
    return await (Ticket as any).find(query)
      .populate('empresaId', 'nombre rfc')
      .populate('usuarioCreador', 'nombre correo')
      .populate('agenteAsignado', 'nombre correo rol')
      .populate('tutor', 'nombre correo')
      .sort({ createdAt: -1 }).exec();
  }

  async cambiarPrioridad(ticketId: string, prioridad: string) {
    const ticket: any = await (Ticket as any).findById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');
    const prioridadAnterior = ticket.prioridad;
    ticket.prioridad = prioridad;
    await ticket.save();
    try {
      await this.publicarEvento('ticket.prioridad_actualizada', {
        ticket: { id: ticket._id.toString(), prioridad, prioridadAnterior }
      });
    } catch (e: any) {
      console.error('No se pudo publicar prioridad actualizada:', e.message);
    }
    return ticket;
  }
}

export default new TicketService();