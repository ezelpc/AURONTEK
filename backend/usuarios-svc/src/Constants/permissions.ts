export const PERMISOS = {
    // ==========================================
    // PERMISOS LOCALES (Scope: Mi Empresa)
    // ==========================================

    // USUARIOS
    USERS_CREATE: 'users.create',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_SUSPEND: 'users.suspend', // Soft-delete / Ban
    USERS_CHANGE_PASSWORD: 'users.change_password',
    USERS_VIEW: 'users.view', // Ver lista de usuarios locales

    // TICKETS
    TICKETS_CREATE: 'tickets.create',
    TICKETS_UPDATE: 'tickets.update', // Editar contenido
    TICKETS_DELETE: 'tickets.delete', // Eliminar físicamente (Riesgo)
    TICKETS_RATE: 'tickets.rate', // Calificar servicio

    // TICKETS - Flujo & Visibilidad Local
    TICKETS_VIEW_ALL: 'tickets.view_all', // Ver TODOS los tickets de la empresa
    TICKETS_VIEW_ASSIGNED: 'tickets.view_assigned', // Ver asignados a mí o donde soy tutor
    TICKETS_VIEW_CREATED: 'tickets.view_created', // Ver los que yo creé

    TICKETS_DELEGATE: 'tickets.delegate', // Asignar a un subordinado (Tutoría)
    TICKETS_ASSIGN: 'tickets.assign', // Asignar a cualquier agente (Manager)
    TICKETS_CHANGE_STATUS: 'tickets.change_status', // Mover flujo (Abierto -> En Proceso -> Resuelto)

    // ==========================================
    // PERMISOS GLOBALES (Scope: Cross-Company / SaaS)
    // Exclusivos Aurontek HQ
    // ==========================================

    TICKETS_VIEW_ALL_GLOBAL: 'tickets.view_all_global', // Ver tickets de CUALQUIER empresa
    TICKETS_DELETE_GLOBAL: 'tickets.delete_global',
    TICKETS_ASSIGN_GLOBAL: 'tickets.assign_global', // Asignar tickets globalmente
    TICKETS_EDIT_GLOBAL: 'tickets.edit_global', // Editar tickets globalmente
    TICKETS_CHANGE_STATUS_GLOBAL: 'tickets.change_status_global', // Cambiar estado globalmente
    TICKETS_CHANGE_PRIORITY_GLOBAL: 'tickets.change_priority_global', // Cambiar prioridad globalmente

    USERS_VIEW_GLOBAL: 'users.view_global', // Ver usuarios de todas las empresas

    // GESTIÓN DE EMPRESAS (SaaS)
    COMPANIES_VIEW_ALL: 'companies.view_all',
    COMPANIES_CREATE: 'companies.create',
    COMPANIES_UPDATE: 'companies.update',
    COMPANIES_DELETE: 'companies.delete',
    COMPANIES_SUSPEND: 'companies.suspend', // Nuevo permiso
    COMPANIES_REGENERATE_CODE: 'companies.regenerate_access_code',

    // ROLES SYSTEM
    ROLES_VIEW: 'roles.view',
    ROLES_CREATE: 'roles.create',
    ROLES_EDIT: 'roles.edit',
    ROLES_DELETE: 'roles.delete',

    // GESTIÓN DE CATÁLOGOS DE SERVICIOS
    SERVICIOS_CREATE_LOCAL: 'servicios.create_local',
    SERVICIOS_EDIT_LOCAL: 'servicios.edit_local',
    SERVICIOS_DELETE_LOCAL: 'servicios.delete_local',
    SERVICIOS_VIEW_LOCAL: 'servicios.view_local',
    SERVICIOS_CREATE_GLOBAL: 'servicios.create_global',
    SERVICIOS_EDIT_GLOBAL: 'servicios.edit_global',
    SERVICIOS_DELETE_GLOBAL: 'servicios.delete_global',
    SERVICIOS_VIEW_GLOBAL: 'servicios.view_global',

    // CARGA MASIVA
    SERVICIOS_IMPORT: 'servicios.import', // Carga masiva de servicios desde CSV
    USUARIOS_IMPORT: 'usuarios.import', // Carga masiva de usuarios desde CSV
    USUARIOS_EXPORT_LAYOUT: 'usuarios.export_layout', // Descargar plantilla CSV para usuarios

    // RECUPERACIÓN DE CONTRASEÑAS
    USERS_RECOVER_PASSWORD_LOCAL: 'users.recover_password_local', // Permite a un admin local iniciar la recuperación para sus usuarios

    // GESTIÓN DE ADMINISTRADORES (ROOT ONLY)
    ADMINS_CREATE: 'admins.create',
    ADMINS_VIEW: 'admins.view',
    ADMINS_EDIT: 'admins.edit',
    ADMINS_DELETE: 'admins.delete',

    // HABILITIES SYSTEM
    HABILITIES_VIEW: 'habilities.view',
    HABILITIES_CREATE: 'habilities.create',
    HABILITIES_EDIT: 'habilities.edit',
    HABILITIES_DELETE: 'habilities.delete',

    // CARE GROUPS (Grupos de Atención)
    CARE_GROUPS_VIEW: 'care_groups.view',
    CARE_GROUPS_CREATE: 'care_groups.create',
    CARE_GROUPS_UPDATE: 'care_groups.update',
    CARE_GROUPS_DELETE: 'care_groups.delete',
};

// ==========================================
// GRUPOS DE PERMISOS (Para asignación masiva)
// ==========================================

// El Administrador de Cliente (Contratante) recibe esto al crear su empresa.
export const PERMISOS_LOCALES_ADMIN = [
    PERMISOS.USERS_CREATE,
    PERMISOS.USERS_UPDATE,
    PERMISOS.USERS_DELETE,
    PERMISOS.USERS_SUSPEND,
    PERMISOS.USERS_CHANGE_PASSWORD,
    PERMISOS.USERS_VIEW,

    PERMISOS.TICKETS_CREATE,
    PERMISOS.TICKETS_UPDATE,
    PERMISOS.TICKETS_DELETE,
    PERMISOS.TICKETS_RATE,
    PERMISOS.TICKETS_VIEW_ALL, // Admin ve todo lo local
    PERMISOS.TICKETS_ASSIGN,
    PERMISOS.TICKETS_DELEGATE,
    PERMISOS.TICKETS_CHANGE_STATUS,
    PERMISOS.SERVICIOS_CREATE_LOCAL,
    PERMISOS.SERVICIOS_EDIT_LOCAL,
    PERMISOS.SERVICIOS_DELETE_LOCAL,
    PERMISOS.SERVICIOS_VIEW_LOCAL,
    PERMISOS.SERVICIOS_IMPORT,
    PERMISOS.USUARIOS_IMPORT,
    PERMISOS.USUARIOS_EXPORT_LAYOUT,
    PERMISOS.USERS_RECOVER_PASSWORD_LOCAL, // Nuevo permiso para admin local
    PERMISOS.HABILITIES_CREATE,
    PERMISOS.HABILITIES_EDIT,
    PERMISOS.HABILITIES_DELETE,
    PERMISOS.HABILITIES_VIEW,
    PERMISOS.ROLES_CREATE,
    PERMISOS.ROLES_EDIT,
    PERMISOS.ROLES_DELETE,
    PERMISOS.ROLES_VIEW
];

// Un usuario básico de cliente (ej. empleado)
export const PERMISOS_USUARIO_FINAL = [
    PERMISOS.TICKETS_CREATE,
    PERMISOS.TICKETS_VIEW_CREATED,
    PERMISOS.TICKETS_RATE
];

// Soporte Técnico Local
export const PERMISOS_SOPORTE_LOCAL = [
    PERMISOS.TICKETS_VIEW_ALL, // O asignados, depende de la política. Usualmente soporte nivel 1 ve cola general.
    PERMISOS.TICKETS_VIEW_ASSIGNED,
    PERMISOS.TICKETS_CHANGE_STATUS,
    PERMISOS.TICKETS_DELEGATE,
    PERMISOS.TICKETS_UPDATE // Añadir notas internas, etc.
];

// Admin Root / Sistema (Acceso Total)
export const PERMISOS_ROOT = ['*'];

// Soporte Global (Aurontek HQ - Helpdesk)
export const PERMISOS_SOPORTE_GLOBAL = [
    PERMISOS.TICKETS_VIEW_ALL_GLOBAL,
    PERMISOS.TICKETS_ASSIGN_GLOBAL,
    PERMISOS.TICKETS_EDIT_GLOBAL,
    PERMISOS.TICKETS_CHANGE_STATUS_GLOBAL,
    PERMISOS.TICKETS_CHANGE_PRIORITY_GLOBAL,
    PERMISOS.TICKETS_CHANGE_STATUS,
    PERMISOS.USERS_VIEW_GLOBAL
];

export const PERMISSION_GROUPS = {
    ADMIN: PERMISOS_LOCALES_ADMIN,
    USER: PERMISOS_USUARIO_FINAL,
    SUPPORT: PERMISOS_SOPORTE_LOCAL,
    GLOBAL_SUPPORT: PERMISOS_SOPORTE_GLOBAL,
    ROOT: PERMISOS_ROOT
};
