// Constantes de permisos (para uso en código)
export const PERMISSIONS = {
    // Usuarios
    USERS_CREATE: 'users.create',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_SUSPEND: 'users.suspend',
    USERS_CHANGE_PASSWORD: 'users.change_password',
    USERS_VIEW: 'users.view',
    USERS_VIEW_GLOBAL: 'users.view_global',
    USERS_RECOVER_PASSWORD_LOCAL: 'users.recover_password_local',

    // Tickets
    TICKETS_CREATE: 'tickets.create',
    TICKETS_UPDATE: 'tickets.update',
    TICKETS_DELETE: 'tickets.delete',
    TICKETS_RATE: 'tickets.rate',
    TICKETS_VIEW_ALL: 'tickets.view_all',
    TICKETS_VIEW_ASSIGNED: 'tickets.view_assigned',
    TICKETS_VIEW_CREATED: 'tickets.view_created',
    TICKETS_VIEW_ALL_GLOBAL: 'tickets.view_all_global',
    TICKETS_ASSIGN: 'tickets.assign',
    TICKETS_DELEGATE: 'tickets.delegate',
    TICKETS_CHANGE_STATUS: 'tickets.change_status',
    TICKETS_MANAGE_GLOBAL: 'tickets.manage_global',
    TICKETS_DELETE_GLOBAL: 'tickets.delete_global',

    // Empresas
    COMPANIES_VIEW_ALL: 'companies.view_all',
    COMPANIES_CREATE: 'companies.create',
    COMPANIES_UPDATE: 'companies.update',
    COMPANIES_DELETE: 'companies.delete',
    COMPANIES_SUSPEND: 'companies.suspend',
    COMPANIES_REGENERATE_CODE: 'companies.regenerate_access_code',
    COMPANIES_MANAGE: 'companies.manage', // Permiso para gestionar empresas (crear, editar, eliminar, etc.)

    // Roles
    ROLES_VIEW: 'roles.view',
    ROLES_CREATE: 'roles.create',
    ROLES_UPDATE: 'roles.update',
    ROLES_DELETE: 'roles.delete',
    ROLES_MANAGE: 'roles.manage', // Permiso general para gestionar roles

    // Servicios
    SERVICIOS_MANAGE_LOCAL: 'servicios.manage_local',
    SERVICIOS_MANAGE_GLOBAL: 'servicios.manage_global',
    SERVICIOS_IMPORT: 'servicios.import',

    // Sistema
    USUARIOS_IMPORT: 'usuarios.import',
    USUARIOS_EXPORT_LAYOUT: 'usuarios.export_layout',
    ADMINS_MANAGE: 'admins.manage',

    // Habilidades / Care Groups
    HABILITIES_VIEW: 'habilities.view',
    CARE_GROUPS_CREATE: 'habilities.create',
    CARE_GROUPS_UPDATE: 'habilities.update',
    CARE_GROUPS_DELETE: 'habilities.delete',
    HABILITIES_MANAGE: 'habilities.manage',
} as const;

// Mapa de permisos con metadata (para UI)
export const PERMISSIONS_MAP: Record<string, { label: string, description: string, group: string }> = {
    // USUARIOS
    'users.create': { label: 'Crear Usuarios', description: 'Permite registrar nuevos usuarios', group: 'Usuarios' },
    'users.update': { label: 'Editar Usuarios', description: 'Modificar datos de usuarios', group: 'Usuarios' },
    'users.delete': { label: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema', group: 'Usuarios' },
    'users.suspend': { label: 'Suspender Usuarios', description: 'Desactivar acceso temporalmente', group: 'Usuarios' },
    'users.change_password': { label: 'Cambiar Contraseñas', description: 'Modificar contraseñas de otros', group: 'Usuarios' },
    'users.view': { label: 'Ver Usuarios Locales', description: 'Ver lista de usuarios de mi empresa', group: 'Usuarios' },
    'users.view_global': { label: 'Ver Todos los Usuarios', description: 'Ver usuarios de todas las empresas', group: 'Usuarios (Global)' },
    'users.recover_password_local': { label: 'Recuperar Contraseña Local', description: 'Iniciar reset de password local', group: 'Usuarios' },

    // TICKETS
    'tickets.create': { label: 'Crear Tickets', description: 'Registrar nuevos incidentes', group: 'Tickets' },
    'tickets.update': { label: 'Editar Tickets', description: 'Modificar tickets existentes', group: 'Tickets' },
    'tickets.delete': { label: 'Eliminar Tickets', description: 'Borrar tickets (Precaución)', group: 'Tickets' },
    'tickets.rate': { label: 'Calificar Tickets', description: 'Evaluar el servicio recibido', group: 'Tickets' },
    'tickets.view_all': { label: 'Ver Todos los Tickets', description: 'Ver todos los tickets de la empresa', group: 'Tickets' },
    'tickets.view_assigned': { label: 'Ver Asignados', description: 'Ver solo tickets asignados', group: 'Tickets' },
    'tickets.view_created': { label: 'Ver Mis Tickets', description: 'Ver solo tickets creados por mí', group: 'Tickets' },
    'tickets.view_all_global': { label: 'Ver Tickets Globales', description: 'Ver tickets de todas las empresas', group: 'Tickets (Global)' },
    'tickets.assign': { label: 'Asignar Tickets', description: 'Asignar tickets a agentes', group: 'Tickets' },
    'tickets.delegate': { label: 'Delegar Tickets', description: 'Reasignar tickets', group: 'Tickets' },
    'tickets.change_status': { label: 'Cambiar Estado', description: 'Avanzar flujo del ticket', group: 'Tickets' },
    'tickets.manage_global': { label: 'Gestión Global Tickets', description: 'Control total de tickets sistema', group: 'Tickets (Global)' },
    'tickets.delete_global': { label: 'Eliminar Tickets Globales', description: 'Eliminar cualquier ticket del sistema', group: 'Tickets (Global)' },

    // EMPRESAS
    'companies.view_all': { label: 'Ver Empresas', description: 'Listar todas las empresas', group: 'Empresas' },
    'companies.create': { label: 'Crear Empresa', description: 'Registrar nuevas empresas', group: 'Empresas' },
    'companies.update': { label: 'Editar Empresa', description: 'Modificar datos de empresas', group: 'Empresas' },
    'companies.delete': { label: 'Eliminar Empresa', description: 'Dar de baja empresas', group: 'Empresas' },
    'companies.suspend': { label: 'Suspender Empresa', description: 'Bloquear acceso a empresa', group: 'Empresas' },
    'companies.regenerate_access_code': { label: 'Regenerar Códigos', description: 'Cambiar códigos de acceso', group: 'Empresas' },

    // ROLES
    'roles.view': { label: 'Ver Roles', description: 'Listar roles configurados', group: 'Roles' },
    'roles.manage': { label: 'Gestionar Roles', description: 'Crear, editar y eliminar roles', group: 'Roles' },

    // SERVICIOS
    'servicios.manage_local': { label: 'Gestionar Servicios Locales', description: 'CRUD catálogo propio', group: 'Servicios' },
    'servicios.manage_global': { label: 'Gestionar Servicios Globales', description: 'CRUD catálogo sistema', group: 'Servicios (Global)' },
    'servicios.import': { label: 'Importar Servicios', description: 'Carga masiva desde CSV', group: 'Servicios' },

    // OTROS
    'usuarios.import': { label: 'Importar Usuarios', description: 'Carga masiva usuarios', group: 'Sistema' },
    'usuarios.export_layout': { label: 'Exportar Layout Usuarios', description: 'Descargar plantilla CSV', group: 'Sistema' },
    'admins.manage': { label: 'Gestionar Admins', description: 'Control total de administradores', group: 'Sistema' },
    'habilities.view': { label: 'Ver Habilidades', description: 'Listar habilidades', group: 'Habilidades' },
    'habilities.manage': { label: 'Gestionar Habilidades', description: 'CRUD habilidades', group: 'Habilidades' },
};

export const GROUPED_PERMISSIONS = Object.entries(PERMISSIONS_MAP).reduce((acc, [key, value]) => {
    if (!acc[value.group]) acc[value.group] = [];
    acc[value.group].push({ key, ...value });
    return acc;
}, {} as Record<string, (typeof PERMISSIONS_MAP[string] & { key: string })[]>);

// Helper para verificar si un permiso es global (solo Aurontek HQ)
export const isGlobalPermission = (permission: string): boolean => {
    const globalPerms: string[] = [
        'tickets.view_all_global',
        'tickets.delete_global',
        'tickets.manage_global',
        'users.view_global',
        'companies.view_all',
        'companies.create',
        'companies.update',
        'companies.delete',
        'companies.suspend',
        'companies.regenerate_access_code',
        'servicios.manage_global',
        'admins.manage',
    ];
    return globalPerms.includes(permission);
};
