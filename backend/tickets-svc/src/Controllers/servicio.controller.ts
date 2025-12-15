import { Request, Response } from 'express';
import Servicio from '../Models/Servicio';

/**
 * Obtiene todos los servicios del catálogo.
 */
export const getAllServicios = async (req: Request, res: Response) => {
  try {
    const { alcance } = req.query;
    const filtro: any = {};

    if (alcance) {
      filtro.alcance = alcance;
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
    const nuevoServicio = new Servicio(req.body);
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
    }

    // Eliminar servicios existentes y crear nuevos
    await Servicio.deleteMany({});
    const serviciosCreados = await Servicio.insertMany(servicios);

    res.status(201).json({
      message: `${serviciosCreados.length} servicios creados exitosamente`,
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
    // Datos de ejemplo para la plantilla
    const templateData = [
      {
        nombre: 'Ejemplo: Falla de impresora',
        tipo: 'Incidente',
        categoria: 'Hardware',
        dependencias: 'Proveedor de impresoras',
        cicloDeVida: 'Activos',
        impacto: '2',
        urgencia: '1',
        prioridad: 'Alta',
        sla: '4 horas',
        cliente: 'Mesa de Servicio',
        gruposDeAtencion: 'Soporte TI'
      },
      {
        nombre: 'Ejemplo: Solicitud de equipo nuevo',
        tipo: 'Requerimiento',
        categoria: 'Computo Personal',
        dependencias: 'Aprobación de gerencia',
        cicloDeVida: 'Activos',
        impacto: '3',
        urgencia: '2',
        prioridad: 'Media',
        sla: '24 horas',
        cliente: 'Recursos Humanos',
        gruposDeAtencion: 'Soporte TI'
      }
    ];

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
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_servicios.csv');
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 recognition
  } catch (error) {
    res.status(500).json({ message: 'Error al generar la plantilla', error });
  }
};