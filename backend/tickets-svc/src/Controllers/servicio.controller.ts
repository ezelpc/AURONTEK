import { Request, Response } from 'express';
import Servicio from '../Models/Servicio';

/**
 * Obtiene todos los servicios del catálogo.
 * Filtra según el alcance solicitado:
 * - global: Servicios de AurontekHQ o marcados como global.
 * - local: Servicios propios de la empresa del usuario.
 */
export const getAllServicios = async (req: Request, res: Response) => {
  try {
    const { alcance } = req.query;
    const empresaIdUsuario = req.usuario?.empresaId;
    const filtro: any = {};

    if (alcance === 'global') {
      // Servicios globales: explicitamente marcados como 'global'
      // Opcional: También podríamos incluir los que tengan empresaId = AurontekHQ si lo tuviéramos hardcodeado
      filtro.alcance = 'global';
    } else if (alcance === 'local') {
      // Servicios locales: pertenecen a la empresa del usuario y son 'local'
      filtro.alcance = 'local';
      filtro.$or = [
        { empresaId: empresaIdUsuario },
        { empresaId: null },
        { empresaId: { $exists: false } }
      ];
    } else {
      // Fallback: si no especifica, comportamiento anterior (todo o nada?)
      // Para seguridad, si no especifica, devolvemos todo si es admin, o solo lo de su empresa.
      // Pero el frontend siempre manda tabs.
    }

    const servicios = await Servicio.find(filtro).sort({ nombre: 1 });
    res.status(200).json(servicios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los servicios', error });
  }
};

/**
 * Crea un nuevo servicio en el catálogo.
 */
export const createServicio = async (req: Request, res: Response) => {
  try {
    const empresaId = req.usuario?.empresaId;
    const rol = req.usuario?.rol || '';

    // Determinar alcance y empresaId
    let datosServicio = { ...req.body };

    // Si es Admin General/Subroot y crea un servicio, por defecto es GLOBAL a menos que se especifique
    // PERO, la UI manda 'alcance' en el body si se selecciona en el form (si existiera field).
    // Asumiremos:
    // - Si Admin General crea: Alcance Global (sin empresaId o AurontekHQ)
    // - Si Admin Empresa crea: Alcance Local + Su EmpresaID

    // Si es Admin General/Subroot, permitir elegir alcance
    if (['admin-general', 'admin-subroot'].includes(rol)) {
      // Respetar alcance enviado desde el form (si existe y es válido)
      if (datosServicio.alcance && ['global', 'local'].includes(datosServicio.alcance)) {
        // Si eligen 'local', se queda sin empresaId (generic local) o nulo
        // Si eligen 'global', es global
      } else {
        // Default si no se especifica
        datosServicio.alcance = 'global';
      }

      // Si es global, empresaId undefined (generic)
      delete datosServicio.empresaId;
    } else {
      // Otros roles (admin empresa) siempre crean local para SU empresa
      datosServicio.alcance = 'local';
      datosServicio.empresaId = empresaId;
    }

    const nuevoServicio = new Servicio(datosServicio);
    await nuevoServicio.save();
    res.status(201).json(nuevoServicio);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el servicio', error });
  }
};

/**
 * Actualiza un servicio existente por su ID.
 */
export const updateServicio = async (req: Request, res: Response) => {
  try {
    const servicioActualizado = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!servicioActualizado) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.status(200).json(servicioActualizado);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el servicio', error });
  }
};

/**
 * Elimina un servicio por su ID.
 */
export const deleteServicio = async (req: Request, res: Response) => {
  try {
    const servicioEliminado = await Servicio.findByIdAndDelete(req.params.id);
    if (!servicioEliminado) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.status(200).json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el servicio', error });
  }
};

/**
 * Permite la carga masiva de servicios desde un JSON (proveniente de un Excel).
 */
export const bulkCreateServicios = async (req: Request, res: Response) => {
  try {
    const servicios = req.body;

    if (!Array.isArray(servicios)) {
      return res.status(400).json({ message: 'Se esperaba un array de servicios' });
    }

    // Validar que cada servicio tenga los campos requeridos
    for (const servicio of servicios) {
      if (!servicio.nombre || !servicio.tipo || !servicio.categoria) {
        return res.status(400).json({
          message: 'Cada servicio debe tener nombre, tipo y categoria'
        });
      }

      // Asignar alcance por defecto si no viene
      if (!servicio.alcance) {
        servicio.alcance = 'local'; // Por defecto local si no se especifica
      }
      // Normalizar alcance a minúsculas
      servicio.alcance = servicio.alcance.toLowerCase();
      if (!['global', 'local'].includes(servicio.alcance)) {
        servicio.alcance = 'local';
      }
    }

    // Insertar nuevos servicios (Append) en lugar de borrar todo
    const serviciosCreados = await Servicio.insertMany(servicios);

    res.status(201).json({
      message: `${serviciosCreados.length} servicios agregados exitosamente`,
      servicios: serviciosCreados
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en la carga masiva', error });
  }
};

/**
 * Genera y descarga una plantilla Excel para la carga masiva de servicios.
 */
export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const { alcance } = req.query;
    const scope = alcance === 'global' ? 'global' : 'local';

    // Datos de ejemplo dinámicos
    let templateData = [];

    if (scope === 'global') {
      templateData = [
        {
          nombre: 'Ejemplo: Acceso a VPN Global',
          tipo: 'Requerimiento',
          categoria: 'Conectividad',
          dependencias: 'N/A',
          cicloDeVida: 'Activos',
          impacto: '3',
          urgencia: '2',
          prioridad: 'Media',
          sla: '24 horas',
          cliente: 'Empleados',
          gruposDeAtencion: 'Soporte TI',
          alcance: 'global'
        },
        {
          nombre: 'Ejemplo: Error en Plataforma Central',
          tipo: 'Incidente',
          categoria: 'Software',
          dependencias: 'Servidores Centrales',
          cicloDeVida: 'Activos',
          impacto: '1',
          urgencia: '1',
          prioridad: 'Critica',
          sla: '2 horas',
          cliente: 'Todos',
          gruposDeAtencion: 'DevOps',
          alcance: 'global'
        }
      ];
    } else {
      templateData = [
        {
          nombre: 'Ejemplo: Falla de impresora local',
          tipo: 'Incidente',
          categoria: 'Hardware',
          dependencias: 'Provedor Local',
          cicloDeVida: 'Activos',
          impacto: '2',
          urgencia: '1',
          prioridad: 'Alta',
          sla: '4 horas',
          cliente: 'Usuarios de Oficina',
          gruposDeAtencion: 'Soporte Sitio',
          alcance: 'local'
        },
        {
          nombre: 'Ejemplo: Solicitud de acceso a puerta',
          tipo: 'Requerimiento',
          categoria: 'Seguridad Física',
          dependencias: 'Administración',
          cicloDeVida: 'Activos',
          impacto: '3',
          urgencia: '2',
          prioridad: 'Media',
          sla: '48 horas',
          cliente: 'Empleados',
          gruposDeAtencion: 'Seguridad',
          alcance: 'local'
        }
      ];
    }

    // Convertir a CSV simple para compatibilidad
    const headers = Object.keys(templateData[0]);
    const csvRows = [
      headers.join(','),
      ...templateData.map(row =>
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ];
    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=plantilla_servicios_${scope}.csv`);
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 recognition
  } catch (error) {
    res.status(500).json({ message: 'Error al generar la plantilla', error });
  }
};