export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: string; // 'admin-general', 'soporte', 'usuario', etc.
    empresaId?: string;
    esAdminGeneral: boolean;
    permisos: string[]; // <--- CRITICAL: Array de permisos inyectado
    activo: boolean;
    foto?: string;
}

export interface Licencia {
    fecha_inicio: string;
    plan: string;
    estado: boolean;
}

export interface Contratante {
    nombre: string;
    correo: string;
    telefono: string;
    puesto: string;
}

export interface Empresa {
    _id: string; // Backend uses _id
    id?: string; // Frontend might use id for compatibility
    nombre: string;
    rfc: string;
    correo: string;
    codigo_acceso?: string;
    direccion?: string;
    telefono?: string;
    tipo: 'sistema' | 'cliente';
    licencia: Licencia[];
    contratantes: Contratante[];
    activo: boolean;
}

export interface Ticket {
    _id?: string;
    id: string;
    titulo: string;
    descripcion: string;
    estado: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    usuarioCreador: User | string;
    agenteAsignado?: User | string;
    empresaId: string;
    imagenes?: string[]; // URLs de imágenes adjuntas
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    token: string;
    usuario: User;
}

export interface MetadataPermisos {
    permisos: Record<string, string>;
    plantillas: Record<string, string[]>;
}
