import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/tickets');
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes y PDF.'));
    }
};

export const uploadConfig = multer({
    storage: storage,
    fileFilter: fileFilter as any,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

const uploadController = {
    uploadFile: (req: Request, res: Response) => {
        try {
            // Soporte para múltiples archivos
            const files = req.files as Express.Multer.File[];
            const file = req.file as Express.Multer.File;

            if (!files && !file) {
                return res.status(400).json({ msg: 'No se subieron archivos' });
            }

            const baseUrl = process.env.API_URL || 'http://localhost:3002';

            // Si es un array de archivos
            if (files && Array.isArray(files)) {
                const uploadedFiles = files.map(f => ({
                    nombre: f.originalname,
                    url: `${baseUrl}/uploads/tickets/${f.filename}`,
                    tipo: f.mimetype,
                    filename: f.filename
                }));

                res.status(201).json({
                    msg: 'Archivos subidos exitosamente',
                    files: uploadedFiles
                });
            } else {
                // Fallback para archivo único
                res.status(201).json({
                    msg: 'Archivo subido exitosamente',
                    files: [{
                        nombre: file.originalname,
                        url: `${baseUrl}/uploads/tickets/${file.filename}`,
                        tipo: file.mimetype,
                        filename: file.filename
                    }]
                });
            }

        } catch (error: any) {
            console.error('Error en uploadController:', error);
            res.status(500).json({ msg: 'Error al subir archivo', error: error.message });
        }
    }
};

export default uploadController;
