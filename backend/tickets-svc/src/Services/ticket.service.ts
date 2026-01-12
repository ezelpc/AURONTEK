// Services/ticket.service.ts
import Ticket from '../Models/Ticket.model';
import Servicio from '../Models/Servicio';
import auditService from './audit.service';
import { notificarTicketCreado, obtenerInfoUsuario } from './notificaciones.helper';
import amqp from 'amqplib';
import axios from 'axios';
import mongoose from 'mongoose';

class TicketService {
  channel: any = null;
  connection: any = null;
  exchange = 'tickets';
  _connecting = false;
  _ready = false; // Flag para saber cuando está listo

  constructor() {
    this.initializeRabbitMQ();
  }

  async initializeRabbitMQ() {
    if (this._connecting) return;
    this._connecting = true;

    const url = process.env.RABBITMQ_URL || process.env.RABBIT_MQ_URL || 'amqp://localhost';

    console.log('📡 [RabbitMQ] Iniciando conexión...');
    console.log('📡 [RabbitMQ] RABBITMQ_URL:', process.env.RABBITMQ_URL ? 'Definida ✅' : 'NO DEFINIDA ❌');

    let attempt = 0;
    const MAX_ATTEMPTS = 5;

    const connectWithRetry = async (): Promise<void> => {
      attempt++;

      if (attempt > MAX_ATTEMPTS) {
        console.error(`❌ [RabbitMQ] No se pudo conectar después de ${MAX_ATTEMPTS} intentos`);
        this._connecting = false;
        this._ready = false;
        return;
      }

      try {
        let connectionUrl = url;
        if (url.includes('cloudamqp')) {
          if (!url.includes('?')) {
            connectionUrl += '?heartbeat=60';
          } else if (!url.includes('heartbeat=')) {
            connectionUrl += '&heartbeat=60';
          }
        }

        console.log(`🔌 [RabbitMQ] Intento ${attempt}/${MAX_ATTEMPTS}...`);
        this.connection = await amqp.connect(connectionUrl);
        this.channel = await this.connection.createConfirmChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

        this.connection.on('error', (err: any) => {
          console.error('❌ [RabbitMQ] Error de conexión:', err.message);
        });

        this.connection.on('close', () => {
          console.warn('⚠️  [RabbitMQ] Conexión cerrada');
          this.channel = null;
          this.connection = null;
          this._ready = false;
        });

        console.log('✅ [RabbitMQ] Conectado y listo');
        this._connecting = false;
        this._ready = true;
      } catch (err: any) {
        console.error(`⚠️  [RabbitMQ] Error intento ${attempt}: ${err.message}`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await connectWithRetry();
        } else {
          this._connecting = false;
          this._ready = false;
        }
      }
    };

    connectWithRetry();
  }

  async publicarEvento(routingKey: string, data: any) {
    // Esperar a que RabbitMQ esté listo (máximo 10 segundos)
    const startTime = Date.now();
    while (!this._ready && (Date.now() - startTime) < 10000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.channel) {
      console.warn(`⚠️  [RabbitMQ] No hay conexión. Evento '${routingKey}' no publicado.`);
      return;
    }

    try {
      const payload = Buffer.from(JSON.stringify(data));
      console.log(`📤 [RabbitMQ] Publicando '${routingKey}' (${payload.length} bytes)`);

      this.channel.publish(this.exchange, routingKey, payload, { persistent: true }, (err: any, ok: any) => {
        if (err) {
          console.error(`❌ [RabbitMQ] Error publicando '${routingKey}':`, err.message);
        } else {
          console.log(`✅ [RabbitMQ] Publicado '${routingKey}'`);
        }
      });
    } catch (error: any) {
      console.error(`❌ [RabbitMQ] Excepción: ${error.message}`);
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

  // ✅ Obtener información de usuario (nombre y email)
  async obtenerInfoUsuario(usuarioId: string): Promise<{ nombre: string; email: string } | null> {
    try {
      const response = await axios.get(
        `${process.env.USUARIOS_SVC_URL}/usuarios/${usuarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
            'X-Service-Name': 'tickets-svc'
          },
          timeout: 5000
        }
      );

      return {
        nombre: response.data.nombre || 'Usuario',
        email: response.data.correo || response.data.email || ''
      };
    } catch (error) {
      console.warn('⚠️  Error obteniendo info de usuario:', usuarioId, error);
      return null;
    }
  }

  async crearTicket(datosTicket: any) {
    try {
      // Calcular fecha de vencimiento basada en SLA del servicio (metadata)
      // Asignar email del creador si viene en datosTicket (desde el controller)
      if (!datosTicket.usuarioCreadorEmail && datosTicket.usuario?.email) {
        datosTicket.usuarioCreadorEmail = datosTicket.usuario.email;
      }

      // ... SLA logic starts here
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

      // ✅ Poblar servicioNombre y gruposDeAtencion desde servicioId
      console.log('[SERVICE] Buscando datos del servicio:', datosTicket.servicioId);
      if (datosTicket.servicioId && !datosTicket.servicioNombre) {
        try {
          const servicio = await Servicio.findById(datosTicket.servicioId);
          if (servicio) {
            datosTicket.servicioNombre = servicio.nombre;
            datosTicket.gruposDeAtencion = servicio.gruposDeAtencion;
            console.log('[SERVICE] ✅ Servicio encontrado:', servicio.nombre);
            console.log('[SERVICE]    Grupo de atención:', servicio.gruposDeAtencion);
          } else {
            console.warn('[SERVICE] ⚠️ Servicio no encontrado');
          }
        } catch (err) {
          console.error('[SERVICE] ❌ Error:', err);
        }
      }

      const nuevoTicket: any = await (Ticket as any).create(datosTicket);

      // ✅ NOTIFICAR CREACIÓN DE TICKET
      try {
        const { notificarTicketCreado } = await import('./notificaciones.helper');
        const creadorInfo = await this.obtenerInfoUsuario(nuevoTicket.usuarioCreador?.toString() || '');

        if (creadorInfo) {
          await notificarTicketCreado(
            nuevoTicket._id.toString(),
            nuevoTicket.titulo,
            nuevoTicket.usuarioCreador?.toString() || '',
            creadorInfo.email,
            creadorInfo.nombre,
            nuevoTicket.empresaId.toString()
          );
        }
      } catch (notifErr: any) {
        console.error('Error notificando creación de ticket:', notifErr.message);
        // No lanzar error, solo registrar
      }

      // Publicar evento para que la IA lo analice y sugiera asignación
      const eventPayload = {
        ticket: {
          id: nuevoTicket._id.toString(),
          titulo: nuevoTicket.titulo,
          descripcion: nuevoTicket.descripcion,
          empresaId: nuevoTicket.empresaId.toString(),
          usuarioCreador: nuevoTicket.usuarioCreador?.toString(),
          servicioNombre: nuevoTicket.servicioNombre || null,
          gruposDeAtencion: datosTicket.gruposDeAtencion || null, // Usar datosTicket ya que no se guarda en el modelo
          tipo: nuevoTicket.tipo || null,
          prioridad: nuevoTicket.prioridad || null,
          categoria: nuevoTicket.categoria || null,
          etiquetas: nuevoTicket.etiquetas || [],
          usuarioCreadorEmail: nuevoTicket.usuarioCreadorEmail
        }
      };

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[RABBITMQ] 📤 Preparando publicación de evento');
      console.log('[RABBITMQ]    Routing Key: ticket.creado');
      console.log('[RABBITMQ]    Ticket ID:', eventPayload.ticket.id);
      console.log('[RABBITMQ]    Servicio:', eventPayload.ticket.servicioNombre);
      console.log('[RABBITMQ]    Grupo:', eventPayload.ticket.gruposDeAtencion);
      console.log('[RABBITMQ] Payload:', JSON.stringify(eventPayload, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      try {
        await this.publicarEvento('ticket.creado', eventPayload);
      } catch (pubErr: any) {
        console.error('No se pudo publicar evento ticket.creado:', pubErr.message || pubErr);
      }

      // Registrar creación en el historial de auditoría
      try {
        await auditService.registrarCreacion(
          nuevoTicket._id.toString(),
          {
            id: nuevoTicket.usuarioCreador?.toString() || 'sistema',
            nombre: 'Usuario', // Se actualizará cuando se enriquezca con datos de usuarios-svc
            correo: 'usuario@aurontek.com'
          },
          {
            titulo: nuevoTicket.titulo,
            estado: nuevoTicket.estado,
            prioridad: nuevoTicket.prioridad
          }
        );
      } catch (auditErr: any) {
        console.error('Error al registrar auditoría de creación:', auditErr.message || auditErr);
        // No lanzar error, solo registrar
      }

      // ✅ AUTOMATIC ASSIGNMENT
      try {
        console.log(`[AUTO-ASSIGN] Intentando asignar ticket ${nuevoTicket._id} automáticamente...`);
        await this.asignarAutomaticamente(nuevoTicket._id.toString(), nuevoTicket.empresaId.toString(), nuevoTicket.servicioId);
      } catch (assignError: any) {
        console.error('[AUTO-ASSIGN] Error en asignación automática:', assignError.message);
        // No fallar la creación si falla la asignación
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

  async obtenerEstadisticas(filtros: any = {}) {
    try {
      // Get total count
      const total = await (Ticket as any).countDocuments(filtros);

      // Get counts by status
      const abiertos = await (Ticket as any).countDocuments({ ...filtros, estado: 'abierto' });
      const enProceso = await (Ticket as any).countDocuments({ ...filtros, estado: 'en_proceso' });
      const enEspera = await (Ticket as any).countDocuments({ ...filtros, estado: 'en_espera' });
      const resueltos = await (Ticket as any).countDocuments({ ...filtros, estado: 'resuelto' });
      const cerrados = await (Ticket as any).countDocuments({ ...filtros, estado: 'cerrado' });
      const cancelados = await (Ticket as any).countDocuments({ ...filtros, estado: 'cancelado' });

      // Get counts by priority
      const prioridadBaja = await (Ticket as any).countDocuments({ ...filtros, prioridad: 'baja' });
      const prioridadMedia = await (Ticket as any).countDocuments({ ...filtros, prioridad: 'media' });
      const prioridadAlta = await (Ticket as any).countDocuments({ ...filtros, prioridad: 'alta' });
      const prioridadCritica = await (Ticket as any).countDocuments({ ...filtros, prioridad: 'critica' });

      return {
        total,
        porEstado: {
          abierto: abiertos,
          en_proceso: enProceso,
          en_espera: enEspera,
          resuelto: resueltos,
          cerrado: cerrados,
          cancelado: cancelados
        },
        porPrioridad: {
          baja: prioridadBaja,
          media: prioridadMedia,
          alta: prioridadAlta,
          critica: prioridadCritica
        }
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  async actualizarEstado(id: string, estado: string, usuarioId?: string, motivo?: string, usuarioNombre?: string) {
    const ticket: any = await (Ticket as any).findById(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    // ✅ Validación: Motivo requerido para "en_espera"
    if (estado === 'en_espera' && !motivo) {
      throw new Error('Se requiere un motivo para poner el ticket en espera');
    }

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
          tiempoEnEspera: ticket.tiempoEnEspera,
          usuarioCreador: ticket.usuarioCreador?.toString(), // For web notifications
          usuarioCreadorEmail: ticket.usuarioCreadorEmail // Send email for notification
        }
      });
    } catch (e: any) {
      console.error('No se pudo publicar estado actualizado:', e.message || e);
    }

    // Registrar cambio de estado en el historial de auditoría
    try {
      await auditService.registrarCambioEstado(
        ticket._id.toString(),
        {
          id: usuarioId || 'sistema',
          nombre: usuarioNombre || (usuarioId ? 'Usuario' : 'Sistema'),
          correo: 'usuario@aurontek.com' // Podríamos pasarlo también si está disponible
        },
        estadoAnterior,
        estado
      );
    } catch (auditErr: any) {
      console.error('Error al registrar auditoría de estado:', auditErr.message || auditErr);
    }

    return ticket;
  }

  async asignarTicket(id: string, agenteId: string, empresaId: string, usuarioId?: string, usuarioNombre?: string) {
    const ticket: any = await (Ticket as any).findById(id);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Validar habilidades del agente
    const agente = await this.validarHabilidadesAgente(agenteId, empresaId);

    ticket.agenteAsignado = new mongoose.Types.ObjectId(agenteId);

    // ✅ NO cambiar el estado automáticamente
    // El agente debe cambiar el estado manualmente cuando comience a trabajar

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

    // ✅ NOTIFICAR ASIGNACIÓN
    try {
      const { notificarTicketAsignado, obtenerInfoUsuario } = await import('./notificaciones.helper');
      const creadorInfo = await obtenerInfoUsuario(ticket.usuarioCreador?.toString() || '');

      if (creadorInfo && agente.correo) {
        await notificarTicketAsignado(
          ticket._id.toString(),
          ticket.titulo,
          agenteId,
          agente.correo,
          agente.nombre,
          creadorInfo.nombre,
          creadorInfo.email,
          empresaId
        );
      }
    } catch (notifErr: any) {
      console.error('Error notificando asignación de ticket:', notifErr.message);
    }

    // Registrar asignación en el historial de auditoría
    try {
      await auditService.registrarAsignacion(
        ticket._id.toString(),
        {
          id: usuarioId || 'sistema',
          nombre: usuarioNombre || (usuarioId ? 'Usuario' : 'Sistema'),
          correo: 'usuario@aurontek.com'
        },
        ticket.agenteAsignado ? 'Agente anterior' : null,
        agente.nombre
      );
    } catch (auditErr: any) {
      console.error('Error al registrar auditoría de asignación:', auditErr.message || auditErr);
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
      console.error('No se pudo publicar evento ticket.clasificado:', e.message);
    }

    // Registrar cambios de clasificación en auditoría
    try {
      await auditService.registrarCambio(
        {
          ticketId: ticket._id.toString(),
          tipo: 'update',
          usuarioId: 'ia-service',
          usuarioNombre: 'IA Service',
          usuarioCorreo: 'ia@aurontek.com',
          cambios: [
            { campo: 'Clasificación IA', valorAnterior: null, valorNuevo: 'Actualizada' },
            ...(clasificacion.prioridad ? [{ campo: 'Prioridad', valorAnterior: null, valorNuevo: clasificacion.prioridad }] : []),
            ...(clasificacion.tipo ? [{ campo: 'Tipo', valorAnterior: null, valorNuevo: clasificacion.tipo }] : [])
          ],
          comentario: 'Clasificación actualizada automáticamente por IA'
        }
      );
    } catch (auditErr: any) {
      console.error('Error al registrar auditoría de clasificación:', auditErr.message || auditErr);
    }

    return ticket;
  }

  // ✅ NUEVO: Asignar ticket automáticamente (desde IA)
  async asignarTicketIA(ticketId: string, agenteId: string) {
    const ticket: any = await (Ticket as any).findById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    // Validar que el agente existe (se hace en agent_assigner)
    ticket.agenteAsignado = new mongoose.Types.ObjectId(agenteId);

    // ✅ NO cambiar el estado automáticamente
    // El agente debe cambiar el estado manualmente cuando comience a trabajar

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

    // Registrar asignación automática en auditoría
    try {
      // Necesitamos el nombre del agente para el log
      // Como no tenemos el objeto agente completo aquí, lo intentamos obtener o usamos el ID
      // O idealmente deberíamos obtener el usuario agente antes

      await auditService.registrarAsignacion(
        ticket._id.toString(),
        {
          id: 'ia-service',
          nombre: 'IA Service',
          correo: 'ia@aurontek.com'
        },
        ticket.agenteAsignado ? 'Agente anterior' : null,
        `Agente ${agenteId}` // Simplificación por ahora
      );
    } catch (auditErr: any) {
      console.error('Error al registrar auditoría de asignación IA:', auditErr.message || auditErr);
    }

    return ticket;
  }

  // ✅ NUEVO: Asignar ticket automáticamente (Lógica interna)
  async asignarAutomaticamente(ticketId: string, empresaId: string, servicioId: string) {
    try {
      // 1. Obtener el servicio para ver el grupo de atención
      const servicio = await Servicio.findById(servicioId);
      if (!servicio) {
        console.log('[AUTO-ASSIGN] Servicio no encontrado, omitiendo asignación.');
        return;
      }

      const grupoAtencion = servicio.gruposDeAtencion;
      if (!grupoAtencion) {
        console.log('[AUTO-ASSIGN] Servicio sin grupo de atención definido, omitiendo asignación.');
        return;
      }

      console.log(`[AUTO-ASSIGN] Buscando agentes para grupo: "${grupoAtencion}" en empresa: ${empresaId}`);

      // 2. Buscar usuarios candidatos en usuarios-svc
      // Necesitamos usuarios de la empresa (o admins internos) que tengan el rol y el grupo adecuado
      const USUARIOS_SVC_URL = process.env.USUARIOS_SVC_URL || 'http://localhost:3000';
      const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

      // Obtener todos los usuarios de la empresa (filtramos en memoria por simplicidad y flexibilidad)
      // En un sistema más grande, estos filtros deberían ir a la query
      const response = await axios.get(`${USUARIOS_SVC_URL}/usuarios`, {
        params: {
          empresa: empresaId,
          activo: true
          // Podríamos agregar filtros de rol aquí si el endpoint lo soporta
        },
        headers: {
          'Authorization': `Bearer ${SERVICE_TOKEN}`,
          'X-Service-Name': 'tickets-svc'
        },
        timeout: 3000 // 3s timeout to avoid blocking ticket creation
      });

      // Manejar formato de respuesta {usuarios: [...]} o [...]
      let usuarios = response.data;
      if (usuarios && typeof usuarios === 'object' && !Array.isArray(usuarios)) {
        usuarios = usuarios.usuarios || usuarios.data || [];
      }
      if (!Array.isArray(usuarios)) {
        console.log('[AUTO-ASSIGN] Formato de respuesta inesperado:', typeof usuarios);
        return;
      }

      // Filtrar candidatos
      const candidatos = usuarios.filter((u: any) => {
        // Roles permitidos para asignación
        const rolValido = ['soporte', 'beca-soporte', 'admin-interno', 'admin-empresa'].includes(u.rol);

        // Debe pertenecer al grupo de atención (si el usuario tiene ese campo)
        // El campo en usuario podría ser 'gruposDeAtencion' (string o array)
        let perteneceAlGrupo = false;
        if (u.gruposDeAtencion) {
          if (Array.isArray(u.gruposDeAtencion)) {
            perteneceAlGrupo = u.gruposDeAtencion.includes(grupoAtencion);
          } else {
            perteneceAlGrupo = u.gruposDeAtencion === grupoAtencion || u.gruposDeAtencion.includes(grupoAtencion);
          }
        }

        // Si es admin-interno o soporte, a veces pueden ver todo, pero mejor respetar el grupo si existe
        // Si el usuario no tiene grupos definidos, ¿lo asignamos? Asumamos que NO por seguridad, salvo admin
        if (!u.gruposDeAtencion && u.rol === 'admin-interno') perteneceAlGrupo = true; // Fallback para admins

        return rolValido && perteneceAlGrupo;
      });

      console.log(`[AUTO-ASSIGN] Encontrados ${candidatos.length} candidatos:`, candidatos.map((c: any) => c.nombre));

      if (candidatos.length === 0) {
        console.log('[AUTO-ASSIGN] No hay candidatos disponibles.');
        return;
      }

      // 3. Balanceo de carga: Elegir el que tenga menos tickets activos
      // Contar tickets 'abierto', 'en_proceso', 'en_espera' para cada candidato
      const cargas = await Promise.all(candidatos.map(async (c: any) => {
        const count = await (Ticket as any).countDocuments({
          agenteAsignado: c._id,
          estado: { $in: ['abierto', 'en_proceso', 'en_espera'] }
        });
        return { ...c, carga: count };
      }));

      // Ordenar por carga ascendente
      cargas.sort((a: any, b: any) => a.carga - b.carga);

      const mejorCandidato = cargas[0];
      console.log(`[AUTO-ASSIGN] Asignando a: ${mejorCandidato.nombre} (Carga actual: ${mejorCandidato.carga})`);

      // 4. Asignar
      await this.asignarTicket(
        ticketId,
        mejorCandidato._id,
        empresaId,
        'sistema', // Usuario ID acciones sistema
        'Sistema (Auto-asignación)' // Nombre usuario sistema
      );

    } catch (error: any) {
      console.error('[AUTO-ASSIGN] Error general:', error.message);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PARA ADMIN GENERAL
  // ==========================================

  async obtenerAurontekHQId(): Promise<string | null> {
    try {
      const apiUrl = `${process.env.USUARIOS_SVC_URL}/empresas`;
      console.log('[AURONTEK_HQ] Fetching from:', apiUrl);

      const response = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
            'X-Service-Name': 'tickets-svc'
          }
        }
      );
      const empresas = response.data;
      // 1. Intentar match exacto o específico
      let aurontekHQ = empresas.find((emp: any) =>
        emp.nombre?.toLowerCase().includes('aurontek') && emp.nombre?.toLowerCase().includes('hq')
      );

      // 2. Si flalla, buscar solo 'aurontek'
      if (!aurontekHQ) {
        console.warn('[AURONTEK_HQ] "Aurontek HQ" no encontrado. Buscando por "aurontek"...');
        aurontekHQ = empresas.find((emp: any) => emp.nombre?.toLowerCase().includes('aurontek'));
      }

      // 3. Si falla, fallback a la primera empresa encontrada (SOLO DEV/ EMERGENCY) o Dummy
      if (!aurontekHQ) {
        console.error('❌ CRITICAL: No se encontró ninguna empresa Aurontek. Usando fallback.');
        // Si hay empresas, usar la primera para no bloquear
        if (empresas.length > 0) {
          aurontekHQ = empresas[0];
          console.warn(`⚠️ Usando primera empresa disponible como HQ: ${aurontekHQ.nombre}`);
        } else {
          // Retornar un ID dummy válido para que Mongoose no falle por required
          // (Esto "traga" el error pero permite testear el endpoint)
          console.warn('⚠️ No hay empresas. Usando ID dummy.');
          return '000000000000000000000000';
        }
      }

      console.log('[AURONTEK_HQ] Found:', aurontekHQ?._id);
      return aurontekHQ?._id || null;
    } catch (error: any) {
      console.error('Error obteniendo Aurontek HQ ID:', error.message);
      // Fallback a Dummy en caso de error de conexión (ej. usuarios-svc caído)
      return '000000000000000000000000';
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
      const USUARIOS_SVC_URL = process.env.USUARIOS_SVC_URL || 'http://localhost:3000';
      const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

      console.log('[ENRICH] Using USUARIOS_SVC_URL:', USUARIOS_SVC_URL);
      console.log('[ENRICH] SERVICE_TOKEN present:', !!SERVICE_TOKEN);

      const userMap: Record<string, any> = {};

      // Fetch users in parallel
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            // Use gateway URL for inter-service communication
            const apiUrl = `${USUARIOS_SVC_URL}/usuarios/${userId}`;
            console.log('[ENRICH] Fetching user from:', apiUrl);

            const response = await axios.get(apiUrl, {
              headers: {
                'Authorization': `Bearer ${SERVICE_TOKEN}`,
                'X-Service-Name': 'tickets-svc'
              }
            });

            userMap[userId] = {
              _id: userId,
              nombre: response.data.nombre || 'N/A',
              correo: response.data.correo || ''
            };
            console.log('[ENRICH] Fetched user', userId, ':', response.data.nombre);
          } catch (error: any) {
            // If user not found in usuarios, try admins collection
            if (error.response?.status === 404) {
              try {
                const adminUrl = `${USUARIOS_SVC_URL}/admins/${userId}`;
                console.log('[ENRICH] User not found, trying admins:', adminUrl);

                const adminResponse = await axios.get(adminUrl, {
                  headers: {
                    'Authorization': `Bearer ${SERVICE_TOKEN}`,
                    'X-Service-Name': 'tickets-svc'
                  }
                });

                userMap[userId] = {
                  _id: userId,
                  nombre: adminResponse.data.nombre || 'Admin',
                  correo: adminResponse.data.correo || ''
                };
                console.log('[ENRICH] Fetched admin', userId, ':', adminResponse.data.nombre);
              } catch (adminError: any) {
                console.error(`[ENRICH] Error fetching admin ${userId}:`, adminError.message);
                userMap[userId] = { _id: userId, nombre: 'Usuario Eliminado', correo: '' };
              }
            } else {
              console.error(`[ENRICH] Error fetching user ${userId}:`, error.message);
              console.error(`[ENRICH] Error details:`, error.response?.data || error);
              userMap[userId] = { _id: userId, nombre: userId.slice(-6), correo: '' };
            }
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

    // 1. Find all LOCAL services (excluding global/internal/platform)
    const localServices = await Servicio.find({
      alcance: 'local' // Only local scope services
    }).select('_id').lean();
    const localServiceIds = localServices.map(s => s._id);

    console.log(`[TICKETS INTERNOS] Found ${localServiceIds.length} local services`);

    // 2. Build query: AurontekHQ tickets + local services only
    const query: any = {
      ...filtros,
      empresaId: aurontekHQId,
      servicioId: { $in: localServiceIds } // ✅ Filter by local services
    };

    // Only populate servicioId - empresaId is just an ObjectId reference
    const tickets = await (Ticket as any).find(query)
      .populate('servicioId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`[TICKETS INTERNOS] Returning ${tickets.length} local tickets`);

    // Enrich with user names
    return await this.enrichTicketsWithUsers(tickets);
  }

  async listarTicketsGlobales(filtros: any = {}) {
    // 1. Find all global services (incluyendo legacy)
    const globalServices = await Servicio.find({
      alcance: { $in: ['global', 'INTERNO', 'PLATAFORMA', 'interno', 'plataforma'] }
    }).select('_id').lean();
    const globalServiceIds = globalServices.map(s => s._id);

    // 2. Build query
    const query: any = {
      ...filtros,
      servicioId: { $in: globalServiceIds }
    };

    // 3. Find tickets
    const tickets = await (Ticket as any).find(query)
      .populate('servicioId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // 4. Enrich with user names
    return await this.enrichTicketsWithUsers(tickets);
  }

  async cambiarPrioridad(ticketId: string, prioridad: string, usuarioId?: string, usuarioNombre?: string) {
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

    // Registrar cambio de prioridad en auditoría
    try {
      await auditService.registrarCambioPrioridad(
        ticket._id.toString(),
        {
          id: usuarioId || 'sistema',
          nombre: usuarioNombre || (usuarioId ? 'Usuario' : 'Sistema'),
          correo: 'usuario@aurontek.com'
        },
        prioridadAnterior,
        prioridad
      );
    } catch (auditErr: any) {
      console.error('Error al registrar auditoría de prioridad:', auditErr.message || auditErr);
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