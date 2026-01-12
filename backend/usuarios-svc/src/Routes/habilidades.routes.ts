import { Router } from 'express';
import habilidadController from '../Controllers/habilidad.controller';
import { verificarToken } from '../Middleware/auth.middleware';
import { requirePermission } from '../Middleware/requirePermission';
import { PERMISOS } from '../Constants/permissions';
import multer from 'multer';

const router = Router();

// Configurar multer para manejar archivos CSV en memoria
const storage = multer.memoryStorage();
const uploadCsv = multer({ storage });

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/habilidades/template - Descargar plantilla CSV (antes de las rutas con :id)
router.get('/template', habilidadController.downloadTemplate);

// POST /api/habilidades/bulk - Carga masiva
router.post('/bulk',
    (req, res, next) => {
        console.log('🔍 [BULK] Request intercepted BEFORE multer');
        console.log('🔍 [BULK] Headers:', req.headers);
        console.log('🔍 [BULK] Content-Type:', req.headers['content-type']);
        console.log('🔍 [BULK] Body (before multer):', req.body);
        next();
    },
    requirePermission(PERMISOS.SERVICIOS_IMPORT),
    uploadCsv.single('file'),
    (req, res, next) => {
        console.log('🔍 [BULK] Request intercepted AFTER multer');
        console.log('🔍 [BULK] req.file:', req.file);
        console.log('🔍 [BULK] req.body (after multer):', req.body);
        next();
    },
    habilidadController.bulkUpload
);

// GET /api/habilidades - Listar habilidades (cualquier usuario autenticado)
router.get('/', requirePermission(PERMISOS.HABILITIES_VIEW), habilidadController.listarHabilidades);

// POST /api/habilidades - Crear habilidad
router.post('/', requirePermission(PERMISOS.HABILITIES_CREATE), habilidadController.crearHabilidad);

// PUT /api/habilidades/:id - Modificar habilidad
router.put('/:id', requirePermission(PERMISOS.HABILITIES_EDIT), habilidadController.modificarHabilidad);

// DELETE /api/habilidades/:id - Eliminar habilidad
router.delete('/:id', requirePermission(PERMISOS.HABILITIES_DELETE), habilidadController.eliminarHabilidad);

export default router;
