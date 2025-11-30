import Ticket, { ITicket } from '../Models/Ticket.model.js';
import amqp, { Channel, Connection, ConfirmChannel } from 'amqplib';
import axios from 'axios';
import mongoose from 'mongoose';

interface ListarOptions {
  pagina?: number;
  limite?: number;
  ordenar?: any;
  poblar?: string[];
}

interface ObtenerOptions {
  poblar?: string[];
}

interface Clasificacion {
  tipo?: string;
  prioridad?: string;
  categoria?: string;
  tiempoResolucion?: number;
  tiempoRespuesta?: number;
}

class TicketService {
  private channel: ConfirmChannel | null = null;
  private connection: Connection | null = null;
  private exchange: string = 'tickets';
  private _connecting: boolean = false;

  constructor() {
    this.initializeRabbitMQ();
  }

  async initializeRabbitMQ(): Promise<void> {
    if (this._connecting) return;
    this._connecting = true;

    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    let attempt = 0;

    const connectWithRetry = async (): Promise<void> => {
      attempt++;
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createConfirmChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

        this.connection.on('error', (err: Error) => {
          console.error('RabbitMQ connection error:', err);
        });

        this.connection.on('close', () => {
          console.warn('RabbitMQ conexión cerrada, reintentando...');
          this.channel = null;
          this.connection = null;
          setTimeout(connectWithRetry, 1000 * Math.min(30, attempt));
        });

        console.log('Conexión establecida con RabbitMQ');
        this._connecting = false;
      } catch (err) {
        console.error(`Error al conectar con RabbitMQ (intento ${attempt}):`, err);
        setTimeout(connectWithRetry, 1000 * Math.min(30, attempt));
      }
    };

    connectWithRetry();
  }

  async publicarEvento(routingKey: string, data: any): Promise<void> {
    if (!this.channel) {
      console.warn('Intento publicar sin conexión con RabbitMQ. Reintentando conexión...');
      this.initializeRabbitMQ();
      throw new Error('No hay conexión con RabbitMQ');
    }

    try {
      const payload = Buffer.from(JSON.stringify(data));
      this.channel.publish(this.exchange, routingKey, payload, { persistent: true }, (err, ok) => {
        if (err) {
          console.error('Publish error:', err);
        } else {
          console.log(`Evento publicado: ${routingKey}`);
        }
      });
    } catch (error) {
      console.error('Error al publicar evento:', error);
      throw error;
    }
  }

  async validarHabilidadesAgente(agenteId: string, empresaId: string): Promise<any> {
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

      // Validar que sea soporte o beca-soporte
      if (!['soporte', 'beca-soporte'].includes(agente.rol)) {
        throw new Error('El usuario asignado debe tener rol de soporte o beca-soporte');
      }

      return agente;
      titulo: nuevoTicket.titulo,
        descripcion: nuevoTicket.descripcion,
          empresaId: nuevoTicket.empresaId.toString(),
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

  async listarTickets(filtros: any = {}, options: ListarOptions = {}): Promise < any > {
  const { pagina = 1, limite = 10, ordenar = { createdAt: -1 }, poblar =[] } = options;
  const skip = (Number(pagina) - 1) * Number(limite);

  let query = Ticket.find(filtros).sort(ordenar).skip(skip).limit(Number(limite));
  poblar.forEach((p: string) => query = query.populate(p, 'nombre correo rol'));

  // Actualizar fechas según el estado
  if(estado === 'en_proceso' && !ticket.fechaRespuesta) {
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
        if(clasificacion.tiempoResolucion) ticket.tiempoResolucion = clasificacion.tiempoResolucion;
        if(clasificacion.tiempoRespuesta) ticket.tiempoRespuesta = clasificacion.tiempoRespuesta;

        // Calcular fechas límite basadas en SLA
        if(ticket.tiempoRespuesta) {
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
    if(ticket.estado === 'abierto') {
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
}

export default new TicketService();