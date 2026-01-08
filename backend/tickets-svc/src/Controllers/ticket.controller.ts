import { Request, Response } from 'express';
import ticketService from '../Services/ticket.service';
import { estadosTicket, tipos, prioridades } from '../Models/Ticket.model';

// Middleware para validar formato ID MongoDB
const validarMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const ticketController = {
  // POST /tickets
  async crear(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({ msg: 'Usuario no autenticado' });
        return;
      }

      let empresaId: string | null | undefined = req.usuario.empresaId;

      // Si el usuario es admin y no tiene empresaId (ej. admin-general), asignar AurontekHQ
      if (!empresaId && ['admin-general', 'admin-subroot', 'admin-interno'].includes(req.usuario.rol || '')) {
        console.log('Admin creando ticket sin empresaId, buscando AurontekHQ...');
        const aurontekHQId = await ticketService.obtenerAurontekHQId();
        // Si no se encuentra AurontekHQ, usar un ID por defecto de desarrollo si estamos en dev, o fallar gracefuly
        if (!aurontekHQId) {
          console.warn('⚠️ No se encontró la empresa AurontekHQ. Asignando ID nulo temporalmente para evitar crash.');
          // Opcional: Crear la empresa si no existe? No, too risky.
          // Dejarlo pasar, tal vez el servicio.empresaId lo llene?
        } else {
          empresaId = aurontekHQId;
        }
      }

      const datosTicket = {
        ...req.body,
        usuarioCreador: req.usuario.id,
        usuarioCreadorEmail: req.usuario.email, // Pass email to service
        etiquetas: req.body.etiquetas || [],
        empresaId: empresaId
      };

      console.log('[DEBUG CREAR] Usuario rol:', req.usuario?.rol);
      console.log('[DEBUG CREAR] EmpresaId final:', empresaId);
      console.log('[DEBUG CREAR] Datos ticket:', JSON.stringify(datosTicket, null, 2));

      // Validar tipo solo si se proporcionó
      if (datosTicket.tipo && !tipos.includes(datosTicket.tipo)) {
        console.warn(`[CREAR TICKET] Tipo inválido: ${datosTicket.tipo}. Esperado: ${tipos.join(', ')}`);
        res.status(400).json({
          msg: `Tipo de ticket inválido. Debe ser uno de: ${tipos.join(', ')}`
        });
        return;
      }

      // Validar prioridad solo si se proporcionó
      if (datosTicket.prioridad && !prioridades.includes(datosTicket.prioridad)) {
        console.warn(`[CREAR TICKET] Prioridad inválida: ${datosTicket.prioridad}. Esperado: ${prioridades.join(', ')}`);
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

      const rol = req.usuario?.rol || '';
      const empresaIdUsuario = req.usuario?.empresaId;

      // Construir filtros según ROL
      let filtros: any = {};

      // 1. Admin General / Subroot: Ven todo (o filtran por query)
      if (['admin-general', 'admin-subroot'].includes(rol)) {
        // Sin filtros = ver todos los tickets
        // Con empresaId en query = filtrar por empresa específica
        if (req.query.empresaId) filtros.empresaId = req.query.empresaId;
        console.log('[DEBUG LISTAR] Admin filtros:', filtros);
      }
      // 2. Soporte Plataforma: Vé tickets EXTERNOS (De clientes, no de HQ)
      else if (rol === 'soporte-plataforma') {
        // Si busca uno específico lo permitimos, si no, traemos todos los que NO son de su empresa (HQ)
        if (req.query.empresaId) {
          // Validar que no sea su propia empresa (HQ) para mantener la lógica? 
          // O simplemente confiar. Mejor forzar externo.
          if (req.query.empresaId !== empresaIdUsuario) {
            filtros.empresaId = req.query.empresaId;
          } else {
            // Si intenta ver HQ, no devolver nada O bloquear.
            // Bloqueo suave: filtro imposible
            filtros.empresaId = '000000000000000000000000';
          }
        } else {
          filtros.empresaId = { $ne: empresaIdUsuario };
        }
      }
      // 3. Resolutor Interno / Admin Interno / Otros Soporte: Vén solo SU empresa
      else {
        filtros.empresaId = empresaIdUsuario;

        // 4. Filtros adicionales por Rol especifico dentro de la empresa

        // Usuario / Cliente Final: Solo SUS tickets
        if (['usuario', 'cliente-final'].includes(rol)) {
          filtros.usuarioCreador = req.usuario?.id;
        }
        // Becario: ¿Solo los suyos o asignados? User: "becario de cualquier area...".
        // Asumimos ver solo sus tickets creados o si se le delegan (asignado).
        else if (rol === 'becario') {
          filtros.$or = [
            { usuarioCreador: req.usuario?.id },
            { agenteAsignado: req.usuario?.id },
            { tutor: req.usuario?.id } // Si fuera tutor?
          ];
        }
        // Soporte (Empresa) / Beca-Soporte / Resolutor Empresa: Ver asignados
        else if (['soporte', 'beca-soporte', 'resolutor-empresa'].includes(rol)) {
          filtros.agenteAsignado = req.usuario?.id;
        }
        // Resolutor Interno (HQ): Vé todos los de su depto?
        // User: "ver tikets internos de las areas de aurontek hq. asigandos a ellos"
        else if (rol === 'resolutor-interno') {
          // Puede ver todos los de HQ o filtrar?
          // "ver todas las funciones de un ticket... si se le asignan permisos"
          // Por ahora ve todos los de HQ (filtros.empresaId base)
          // O podríamos restringir a asignados si 'asignado=true' viene en query.
        }
      }

      // Filtros query params adicionales
      if (estado) filtros.estado = estado;
      if (prioridad) filtros.prioridad = prioridad;

      // asignado query override (si el rol lo permite)
      // Si el rol ya forzó filtros (ej. soporte solo asignados), esto podría entrar en conflicto.
      // Pero si el usuario es 'admin-interno' y quiere ver 'asignados', aquí se lo permitimos.
      if (typeof asignado !== 'undefined' && !['soporte', 'beca-soporte', 'resolutor-empresa'].includes(rol)) {
        if (asignado === 'true') filtros.agenteAsignado = { $ne: null };
        else if (asignado === 'false') filtros.agenteAsignado = null;
      }

      console.log('[DEBUG LISTAR] Usuario:', req.usuario);
      console.log('[DEBUG LISTAR] Filtros base:', filtros);

      const tickets = await ticketService.listarTickets(filtros, {
        pagina: Number(pagina),
        limite: Number(limite),
        ordenar: { createdAt: -1 },
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor', 'servicioId']
      });

      console.log('[DEBUG LISTAR] Resultados encontrados:', tickets?.data?.length || 0);

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
        poblar: ['usuarioCreador', 'agenteAsignado', 'tutor', 'servicioId']
      });

      if (!ticket) {
        res.status(404).json({ msg: 'Ticket no encontrado' });
        return;
      }

      // Modificación: Uso de Permisos Granulares
      const permisos = req.usuario?.permisos || [];
      const isGlobalAdmin = permisos.includes('tickets.view_all_global') || ['admin-general', 'admin-subroot'].includes(req.usuario?.rol || '');
      const canViewLocal = permisos.includes('tickets.view_all');

      // 1. Acceso Global: Si tiene tickets.view_all_global, pasa directo
      if (isGlobalAdmin) {
        res.json(ticket);
        return;
      }

      // 2. Acceso Local: Si tiene tickets.view_all, validar que sea de su empresa
      if (canViewLocal && ticket.empresaId.toString() === req.usuario?.empresaId) {
        res.json(ticket);
        return;
      }

      // 3. Acceso por Propiedad/Asignación (para usuarios sin permisos de "ver todo")
      // - Creador del ticket
      // - Agente Asignado
      // - Tutor (si aplica)
      const esPropio = (
        ticket.usuarioCreador?._id?.toString() === req.usuario?.id ||
        ticket.agenteAsignado?._id?.toString() === req.usuario?.id ||
        ticket.tutor?._id?.toString() === req.usuario?.id
      );

      if (esPropio) {
        res.json(ticket);
        return;
      }

      // Si no cumple ninguna, rechazar
      res.status(403).json({ msg: 'No autorizado para ver este ticket' });
      return;

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
      const { estado, motivo } = req.body;

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

      // Autorización: Uso de Permisos Granulares
      const permisos = req.usuario?.permisos || [];

      // 1. Permiso Explícito: tickets.change_status
      const tienePermiso = permisos.includes('tickets.change_status');

      // 2. Roles Legacy (por si acaso, aunque deberíamos movernos a permisos)
      const rolesPermitidos = ['soporte', 'beca-soporte', 'admin-interno', 'admin-general', 'admin-subroot'];
      const esRolPermitido = req.usuario && rolesPermitidos.includes(req.usuario.rol || '');

      if (!tienePermiso && !esRolPermitido) {
        res.status(403).json({ msg: 'No autorizado para actualizar el estado (permiso tickets.change_status requerido)' });
        return;
      }

      // 3. Validar Scope de Empresa (Si no es admin global)
      // Necesitamos obtener el ticket primero para ver su empresa?
      // ticketService.actualizarEstado ya lo busca, pero la validación de seguridad debería ser ANTES.
      // Sin embargo, para eficiencia, confiamos en que el service o una consulta previa lo valide.
      // Dado que updateTicket verifica existencia, PERO aqui necesitamos validar propiedad.

      // Opcion A: Recuperar ticket para validar empresa
      const ticket = await ticketService.obtenerTicket(id);
      if (!ticket) {
        res.status(404).json({ msg: 'Ticket no encontrado' });
        return;
      }

      const isGlobal = permisos.includes('tickets.manage_global') || ['admin-general', 'admin-subroot'].includes(req.usuario?.rol || '');
      if (!isGlobal && ticket.empresaId.toString() !== req.usuario?.empresaId) {
        res.status(403).json({ msg: 'No autorizado para modificar tickets de otra empresa' });
        return;
      }

      // Si pasa validaciones, proceder
      const ticketActualizado = await ticketService.actualizarEstado(id, estado, req.usuario!.id, motivo, req.usuario!.nombre);
      res.json(ticketActualizado);
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

      if (!['admin-interno', 'admin-general', 'admin-subroot'].includes(req.usuario.rol)) {
        res.status(403).json({ msg: 'No autorizado para asignar tickets' });
        return;
      }

      const ticket = await ticketService.asignarTicket(id, agenteId, req.usuario.empresaId!, req.usuario?.id, req.usuario?.nombre);
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
        req.usuario.empresaId!
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
  },

  // DELETE /tickets/:id
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID inválido' });
        return;
      }

      // Solo admin-general/subroot pueden eliminar tickets fisicamente
      if (!['admin-general', 'admin-subroot'].includes(req.usuario?.rol || '')) {
        res.status(403).json({ msg: 'No autorizado para eliminar tickets' });
        return;
      }

      await ticketService.eliminarTicket(id);
      res.json({ msg: 'Ticket eliminado correctamente' });
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  },

  // GET /tickets/:id/history
  async obtenerHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!validarMongoId(id)) {
        res.status(400).json({ msg: 'ID inválido' });
        return;
      }

      const ticket = await ticketService.obtenerTicket(id);
      if (!ticket) {
        res.status(404).json({ msg: 'Ticket no encontrado' });
        return;
      }

      // Importar el servicio de auditoría
      const auditService = (await import('../Services/audit.service')).default;

      // Obtener historial real desde la base de datos
      const historial = await auditService.obtenerHistorial(id);

      // Formatear la respuesta para el frontend
      const historialFormateado = historial.map((entry: any) => ({
        _id: entry._id,
        ticketId: entry.ticketId,
        tipo: entry.tipo,
        usuario: {
          nombre: entry.usuarioNombre,
          correo: entry.usuarioCorreo
        },
        cambios: entry.cambios,
        comentario: entry.comentario,
        createdAt: entry.createdAt
      }));

      res.json(historialFormateado);
    } catch (error: any) {
      console.error('[obtenerHistorial] Error:', error);
      res.status(500).json({ msg: error.message });
    }
  }
};

export default ticketController;