import express from 'express';
import servicioController from '../Controllers/servicio.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';
import multer from 'multer';

const storage = multer.memoryStorage();
const uploadCsv = multer({ storage });

const router = express.Router();

/**
 * @route   GET /api/servicios
 * @desc    Obtiene el catálogo de servicios para el usuario final.
 * @access  Private
 */
router.get('/',
    [verificarToken],
    servicioController.listarServiciosParaUsuario
);

/**
 * @route   GET /api/servicios/gestion
 * @desc    Obtiene los servicios que un admin puede gestionar.
 * @access  Private
 */
router.get('/gestion',
    [verificarToken],
    servicioController.listarServiciosParaGestion
);

/**
 * @route   POST /api/servicios
 * @desc    Crea un nuevo servicio.
 * @access  Private
 */
router.post('/',
    [verificarToken],
    servicioController.crearServicio
);

/**
 * @route   PUT /api/servicios/:id
 * @desc    Modifica un servicio existente.
 * @access  Private
 */
router.put('/:id',
    [verificarToken],
    servicioController.modificarServicio
);

/**
 * @route   DELETE /api/servicios/:id
 * @desc    Elimina un servicio.
 * @access  Private
 */
router.delete('/:id',
    [verificarToken],
    servicioController.eliminarServicio
);

/**
 * @route   GET /api/servicios/actions/layout
 * @desc    Descarga la plantilla CSV para servicios.
 * @access  Private
 */
router.get('/actions/layout',
    verificarToken,
    requirePermission(PERMISOS.SERVICIOS_IMPORT),
    servicioController.descargarLayoutServicios
);

/**
 * @route   POST /api/servicios/actions/import
 * @desc    Importa servicios desde un archivo CSV.
 * @access  Private
 */
router.post('/actions/import',
    verificarToken,
    requirePermission(PERMISOS.SERVICIOS_IMPORT),
    uploadCsv.single('file'),
    servicioController.importarServicios
);

export default router;