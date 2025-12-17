// Frontend-only permission templates
// These are UI presets to help admins quickly configure roles
// They do NOT affect backend permission assignment

export const PERMISSION_TEMPLATES = {
    ADMIN_COMPLETO: {
        nombre: 'Administrador Completo',
        descripcion: 'Acceso total a la gestión de la empresa',
        permisos: [
            'users.create',
            'users.update',
            'users.delete',
            'users.view',
            'users.suspend',
            'users.recover_password_local',
            'tickets.create',
            'tickets.view_all',
            'tickets.assign',
            'tickets.change_status',
            'servicios.manage_local',
            'servicios.import',
            'roles.view',
            'roles.manage'
        ]
    },
    SOPORTE_TECNICO: {
        nombre: 'Soporte Técnico',
        descripcion: 'Gestión de tickets y atención al cliente',
        permisos: [
            'tickets.create',
            'tickets.view_all',
            'tickets.update',
            'tickets.change_status',
            'tickets.assign',
            'users.view'
        ]
    },
    USUARIO_BASICO: {
        nombre: 'Usuario Básico',
        descripcion: 'Solo puede crear y ver sus propios tickets',
        permisos: [
            'tickets.create',
            'tickets.view_created',
            'tickets.rate'
        ]
    },
    SUPERVISOR: {
        nombre: 'Supervisor',
        descripcion: 'Supervisión de equipo y tickets',
        permisos: [
            'tickets.create',
            'tickets.view_all',
            'tickets.assign',
            'tickets.delegate',
            'tickets.change_status',
            'users.view'
        ]
    },
    GESTOR_SERVICIOS: {
        nombre: 'Gestor de Servicios',
        descripcion: 'Administración del catálogo de servicios',
        permisos: [
            'servicios.manage_local',
            'servicios.import',
            'tickets.view_all',
            'tickets.create'
        ]
    }
};

export const getTemplatesList = () => {
    return Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => ({
        id: key,
        ...template
    }));
};
