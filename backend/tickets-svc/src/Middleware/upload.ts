import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Los archivos se guardarán temporalmente en una carpeta 'uploads' en la raíz del proyecto
    // Asegúrate de que esta carpeta exista o créala
    cb(null, path.join(__dirname, '../../../../uploads'));
  },
  filename: function (req, file, cb) {
    // Generar un nombre de archivo único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos para aceptar solo archivos de Excel
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|xlsx|xls|csv/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: ¡Solo se permiten archivos de imagen y de Excel/CSV!');
  }
};

// Middleware de Multer configurado
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Límite de 5MB por archivo
  },
  fileFilter: fileFilter
});

export default upload;
