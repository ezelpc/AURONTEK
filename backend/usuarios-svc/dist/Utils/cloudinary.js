"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
// 🧩 Configuración de Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// ⚙️ Configuración de Multer (memoria)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes.'));
        }
    }
});
exports.upload = upload;
// ☁️ Middleware para subir imagen a Cloudinary
const uploadToCloudinary = async (req, res, next) => {
    if (!req.file)
        return next();
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'aurontek_perfiles' }, (error, uploadResult) => {
                if (error)
                    return reject(error);
                resolve(uploadResult);
            });
            stream.end(req.file.buffer);
        });
        req.imageUrl = result.secure_url;
        next();
    }
    catch (error) {
        console.error('Error al subir la imagen:', error);
        res.status(500).json({ msg: 'Error al subir la imagen a Cloudinary.' });
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
