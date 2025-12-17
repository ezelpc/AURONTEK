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

    // Debug: Mostrar valor de RABBITMQ_URL
    console.log('🔍 DEBUG - RABBITMQ_URL:', process.env.RABBITMQ_URL ? 'Definida' : 'NO DEFINIDA');
    console.log('🔍 DEBUG - URL a usar:', url.substring(0, 20) + '...');

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
      // Calcular fecha de vencimiento basada en SLA del servicio (metadata)
      if (datosTicket.metadata?.sla) {
        const slaString = datosTicket.metadata.sla.toLowerCase();
        let horas = 0;

        // Parsear "X horas"
        if (slaString.includes('horas') || slaString.includes('hora')) {
          const matches = slaString.match(/(\d+)\s*horas?/);
          if (matches && matches[1]) {
            horas = parseInt(matches[1], 10);
          }
        }
        // Parsear "X dias"
        else if (slaString.includes('dias') || slaString.includes('día') || slaString.includes('días')) {
          const matches = slaString.match(/(\d+)\s*d/);
          if (matches && matches[1]) {
            horas = parseInt(matches[1], 10) * 24;
          }
        }

        if (horas > 0) {
          datosTicket.tiempoResolucion = horas * 60; // Guardar en minutos para consistencia
          datosTicket.fechaLimiteResolucion = new Date(Date.now() + horas * 60 * 60 * 1000);
          console.log(`[SLA] Calculated due date: ${datosTicket.fechaLimiteResolucion} (${horas} hours)`);
        }
      }

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

    try {
      let query: any = (Ticket as any).find(filtros).sort(ordenar).skip(skip).limit(Number(limite));

      // Only populate servicioId which is in the same database
      // User references (usuarioCreador, agenteAsignado, tutor) are in usuarios-svc
      const localPopulate = poblar.filter((p: string) => p === 'servicioId');
      localPopulate.forEach((p: string) => query = query.populate(p));

      const docs = await query.lean().exec();
      const total = await (Ticket as any).countDocuments(filtros);

      // Enrich tickets with user names
      const enrichedDocs = await this.enrichTicketsWithUsers(docs);

      return { data: enrichedDocs, pagina: Number(pagina), limite: Number(limite), total };
    } catch (error) {
      console.error('Error listing tickets:', error);
      throw error;
    }
  }

  async obtenerTicket(id: string, options: any = {}) {
    let q: any = (Ticket as any).findById(id);

    // Only populate valid local refs (servicioId)
    // Avoid populating users as they live in another service
    const populateFields = (options.poblar || []).filter((p: string) => p === 'servicioId');
    populateFields.forEach((p: string) => (q = q.populate(p)));

    let ticket = await q.lean().exec();
    if (!ticket) throw new Error('Ticket no encontrado');

    // Enrich single ticket with user data
    const [enrichedTicket] = await this.enrichTicketsWithUsers([ticket]);
    return enrichedTicket;
  }

  async actualizarEstado(id: string, estado: string, usuarioId?: string, motivo?: string) {
    const ticket: any = await (Ticket as any).findById(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    const estadoAnterior = ticket.estado;

    // Lógica de pausa de SLA
    // Si está saliendo de "en_espera", calcular tiempo pausado
    if (estadoAnterior === 'en_espera' && estado !== 'en_espera') {
      if (ticket.fechaInicioEspera) {
        const duracion = Date.now() - ticket.fechaInicioEspera.getTime();
        ticket.tiempoEnEspera = (ticket.tiempoEnEspera || 0) + duracion;

        // Agregar al historial
        if (!ticket.historialEspera) ticket.historialEspera = [];
        ticket.historialEspera.push({
          inicio: ticket.fechaInicioEspera,
          fin: new Date(),
          duracion,
          motivo: motivo || 'No especificado'
        });

        ticket.fechaInicioEspera = undefined;
        console.log(`[SLA] Ticket ${id} salió de espera. Tiempo pausado: ${duracion}ms`);
      }
    }

    // Si está entrando a "en_espera", marcar inicio
    if (estadoAnterior !== 'en_espera' && estado === 'en_espera') {
      ticket.fechaInicioEspera = new Date();
      console.log(`[SLA] Ticket ${id} entró en espera. SLA pausado.`);
    }

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
          actualizadoPor: usuarioId,
          tiempoEnEspera: ticket.tiempoEnEspera
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

  // Helper: Enrich tickets with user names from usuarios-svc
  private async enrichTicketsWithUsers(tickets: any[]): Promise<any[]> {
    try {
      console.log('[ENRICH] Starting enrichment for', tickets.length, 'tickets');

      // Collect unique user IDs
      const userIds = new Set<string>();
      tickets.forEach(ticket => {
        if (ticket.usuarioCreador) userIds.add(ticket.usuarioCreador.toString());
        if (ticket.agenteAsignado) userIds.add(ticket.agenteAsignado.toString());
        if (ticket.tutor) userIds.add(ticket.tutor.toString());
      });

      console.log('[ENRICH] Found', userIds.size, 'unique user IDs:', Array.from(userIds));

      if (userIds.size === 0) return tickets;

      // Fetch user data from usuarios-svc
      const USUARIOS_SVC_URL = process.env.USUARIOS_SVC_URL || 'http://localhost:3001';
      const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

      console.log('[ENRICH] Using USUARIOS_SVC_URL:', USUARIOS_SVC_URL);
      console.log('[ENRICH] SERVICE_TOKEN present:', !!SERVICE_TOKEN);

      const userMap: Record<string, any> = {};

      // Fetch users in parallel
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const response = await axios.get(`${USUARIOS_SVC_URL}/usuarios/${userId}`, {
              headers: {
                'Authorization': `Bearer ${SERVICE_TOKEN}`
              }
            });
            userMap[userId] = {
              _id: userId,
              nombre: response.data.nombre || 'N/A',
              correo: response.data.correo || ''
            };
            console.log('[ENRICH] Fetched user', userId, ':', response.data.nombre);
          } catch (error: any) {
            console.error(`[ENRICH] Error fetching user ${userId}:`, error.message);
            userMap[userId] = { _id: userId, nombre: userId.slice(-6), correo: '' };
          }
        })
      );

      console.log('[ENRICH] User map:', userMap);

      // Enrich tickets
      const enriched = tickets.map(ticket => ({
        ...ticket,
        usuarioCreador: ticket.usuarioCreador ? userMap[ticket.usuarioCreador.toString()] : null,
        agenteAsignado: ticket.agenteAsignado ? userMap[ticket.agenteAsignado.toString()] : null,
        tutor: ticket.tutor ? userMap[ticket.tutor.toString()] : null
      }));

      console.log('[ENRICH] Enrichment complete. Sample ticket:', enriched[0]);
      return enriched;
    } catch (error) {
      console.error('[ENRICH] Error enriching tickets with users:', error);
      return tickets; // Return original tickets if enrichment fails
    }
  }

  async listarTicketsEmpresas(filtros: any = {}) {
    const aurontekHQId = await this.obtenerAurontekHQId();
    const query: any = { ...filtros };
    if (aurontekHQId) query.empresaId = { $ne: aurontekHQId };
    // Only populate servicioId - empresaId is just an ObjectId reference
    const tickets = await (Ticket as any).find(query)
      .populate('servicioId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Enrich with user names
    return await this.enrichTicketsWithUsers(tickets);
  }

  async listarTicketsInternos(filtros: any = {}) {
    const aurontekHQId = await this.obtenerAurontekHQId();
    if (!aurontekHQId) return [];
    const query: any = { ...filtros, empresaId: aurontekHQId };
    // Only populate servicioId - empresaId is just an ObjectId reference
    const tickets = await (Ticket as any).find(query)
      .populate('servicioId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Enrich with user names
    return await this.enrichTicketsWithUsers(tickets);
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

  async eliminarTicket(id: string) {
    const ticket = await (Ticket as any).findByIdAndDelete(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    try {
      await this.publicarEvento('ticket.eliminado', { ticket: { id } });
    } catch (e) { console.error('Error publicando ticket.eliminado', e); }

    return ticket;
  }
}

export default new TicketService();