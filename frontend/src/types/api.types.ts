export interface User {
    _id?: string;
    id: string; // Used by frontend logic often
    nombre: string;
    email: string;
    correo?: string; // Raw DB field
    rol: string;
    empresaId?: string;
    empresa?: string; // Sometimes populated with name
    esAdminGeneral: boolean;
    permisos: string[];
    activo: boolean;
    foto?: string;
    fotoPerfil?: string; // Raw DB field
}

export interface Service {
    _id?: string;
    nombre: string;
    descripcion: string;
    alcance: 'global' | 'local';
    empresa?: string; // ID if local
    tipo: string;
    area: string;
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    sla: string;
    gruposDeAtencion: string;
    precio: number;
    activo: boolean;
    categoria?: string; // Added for frontend compatibility if needed
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
    _id: string;
    id?: string;
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
    usuarioCreador: User | string; // Can be ID or populated object
    agenteAsignado?: User | string;
    empresaId?: Empresa | string; // Can be ID or populated object
    tipo?: string;
    categoria?: string;
    servicioNombre?: string;
    servicioId?: string;
    servicio?: string;
    metadata?: any;
    tiempoEnEspera?: number;
    adjuntos?: { url: string; nombre: string; tipo: string }[];
    imagenes?: string[];
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
