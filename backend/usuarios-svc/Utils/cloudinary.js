import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// 🧩 Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ⚙️ Configuración de Multer (memoria)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes.'), false);
    }
  }
});

// ☁️ Middleware para subir imagen a Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'aurontek_perfiles' },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(req.file.buffer);
    });

    req.imageUrl = result.secure_url;
    next();
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    res.status(500).json({ msg: 'Error al subir la imagen a Cloudinary.' });
  }
};

// ✅ Exportación ESM
export { upload, uploadToCloudinary };
