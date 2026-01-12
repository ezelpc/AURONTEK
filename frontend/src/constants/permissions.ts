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
    USERS_RECOVER_PASSWORD_GLOBAL: 'users.recover_password_global',

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
    TICKETS_CREATE_GLOBAL: 'tickets.create_global',

    // Empresas
    COMPANIES_VIEW_ALL: 'companies.view_all',
    COMPANIES_CREATE: 'companies.create',
    COMPANIES_UPDATE: 'companies.update',
    COMPANIES_DELETE: 'companies.delete',
    COMPANIES_SUSPEND: 'companies.suspend',
    COMPANIES_REGENERATE_CODE: 'companies.regenerate_access_code',
    // Roles
    ROLES_VIEW: 'roles.view',
    ROLES_CREATE: 'roles.create',
    ROLES_EDIT: 'roles.edit',
    ROLES_DELETE: 'roles.delete',

    // GESTIÓN DE CATÁLOGOS DE SERVICIOS
    SERVICIOS_CREATE_LOCAL: 'servicios.create_local',
    SERVICIOS_EDIT_LOCAL: 'servicios.edit_local',
    SERVICIOS_DELETE_LOCAL: 'servicios.delete_local',
    SERVICIOS_VIEW_LOCAL: 'servicios.view_local',
    SERVICIOS_MANAGE_LOCAL: 'servicios.manage_local', // Manage all local service operations
    SERVICIOS_CREATE_GLOBAL: 'servicios.create_global',
    SERVICIOS_EDIT_GLOBAL: 'servicios.edit_global',
    SERVICIOS_DELETE_GLOBAL: 'servicios.delete_global',
    SERVICIOS_VIEW_GLOBAL: 'servicios.view_global',
    SERVICIOS_IMPORT: 'servicios.import',

    // Sistema
    USUARIOS_IMPORT: 'usuarios.import',
    USUARIOS_EXPORT_LAYOUT: 'usuarios.export_layout',
    // GESTIÓN DE ADMINISTRADORES (ROOT ONLY)
    ADMINS_CREATE: 'admins.create',
    ADMINS_VIEW: 'admins.view',
    ADMINS_EDIT: 'admins.edit',
    ADMINS_DELETE: 'admins.delete',
    ADMINS_MANAGE: 'admins.manage', // Manage all admin operations

    // Habilidades / Care Groups
    HABILITIES_VIEW: 'habilities.view',
    HABILITIES_CREATE: 'habilities.create',
    HABILITIES_EDIT: 'habilities.edit',
    HABILITIES_DELETE: 'habilities.delete',
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
    'tickets.create_global': { label: 'Crear Globales', description: 'Crear tickets para servicios de sistema', group: 'Tickets (Global)' },

    // EMPRESAS
    'companies.view_all': { label: 'Ver Empresas', description: 'Listar todas las empresas', group: 'Empresas' },
    'companies.create': { label: 'Crear Empresa', description: 'Registrar nuevas empresas', group: 'Empresas' },
    'companies.update': { label: 'Editar Empresa', description: 'Modificar datos de empresas', group: 'Empresas' },
    'companies.delete': { label: 'Eliminar Empresa', description: 'Dar de baja empresas', group: 'Empresas' },
    'companies.suspend': { label: 'Suspender Empresa', description: 'Bloquear acceso a empresa', group: 'Empresas' },
    'companies.regenerate_access_code': { label: 'Regenerar Códigos', description: 'Cambiar códigos de acceso', group: 'Empresas' },

    // ROLES
    'roles.view': { label: 'Ver Roles', description: 'Listar roles configurados', group: 'Roles' },
    'roles.create': { label: 'Crear Roles', description: 'Crear nuevos roles', group: 'Roles' },
    'roles.edit': { label: 'Editar Roles', description: 'Modificar roles existentes', group: 'Roles' },
    'roles.delete': { label: 'Eliminar Roles', description: 'Eliminar roles', group: 'Roles' },

    // SERVICIOS
    'servicios.create_local': { label: 'Crear Servicios Locales', description: 'Crear servicios en catálogo propio', group: 'Servicios' },
    'servicios.edit_local': { label: 'Editar Servicios Locales', description: 'Modificar servicios propios', group: 'Servicios' },
    'servicios.delete_local': { label: 'Eliminar Servicios Locales', description: 'Eliminar servicios propios', group: 'Servicios' },
    'servicios.view_local': { label: 'Ver Servicios Locales', description: 'Ver catálogo propio', group: 'Servicios' },
    'servicios.manage_local': { label: 'Gestionar Servicios Locales', description: 'Gestión completa de servicios locales', group: 'Servicios' },
    'servicios.create_global': { label: 'Crear Servicios Globales', description: 'Crear servicios en catálogo sistema', group: 'Servicios (Global)' },
    'servicios.edit_global': { label: 'Editar Servicios Globales', description: 'Modificar servicios del sistema', group: 'Servicios (Global)' },
    'servicios.delete_global': { label: 'Eliminar Servicios Globales', description: 'Eliminar servicios del sistema', group: 'Servicios (Global)' },
    'servicios.view_global': { label: 'Ver Servicios Globales', description: 'Ver catálogo del sistema', group: 'Servicios (Global)' },
    'servicios.import': { label: 'Importar Servicios', description: 'Carga masiva desde CSV', group: 'Servicios' },

    // OTROS
    'usuarios.import': { label: 'Importar Usuarios', description: 'Carga masiva usuarios', group: 'Sistema' },
    'usuarios.export_layout': { label: 'Exportar Layout Usuarios', description: 'Descargar plantilla CSV', group: 'Sistema' },
    'admins.create': { label: 'Crear Admins', description: 'Crear administradores', group: 'Sistema' },
    'admins.view': { label: 'Ver Admins', description: 'Listar administradores', group: 'Sistema' },
    'admins.edit': { label: 'Editar Admins', description: 'Modificar administradores', group: 'Sistema' },
    'admins.delete': { label: 'Eliminar Admins', description: 'Eliminar administradores', group: 'Sistema' },
    'admins.manage': { label: 'Gestionar Admins', description: 'Gestión completa de administradores', group: 'Sistema' },
    'habilities.view': { label: 'Ver Habilidades', description: 'Listar habilidades', group: 'Habilidades' },
    'habilities.create': { label: 'Crear Habilidades', description: 'Crear nuevas habilidades', group: 'Habilidades' },
    'habilities.edit': { label: 'Editar Habilidades', description: 'Modificar habilidades', group: 'Habilidades' },
    'habilities.delete': { label: 'Eliminar Habilidades', description: 'Eliminar habilidades', group: 'Habilidades' },
};

export const GROUPED_PERMISSIONS = Object.entries(PERMISSIONS_MAP).reduce((acc, [key, value]) => {
    if (!acc[value.group]) acc[value.group] = [];
    acc[value.group].push({ key, ...value });
    return acc;
}, {} as Record<string, (typeof PERMISSIONS_MAP[string] & { key: string })[]>);

// --- Company Specific Permissions Grouping ---
const COMPANY_PERMISSIONS_LIST = [
    // Users
    'users.create', 'users.update', 'users.delete', 'users.view',
    // Roles
    'roles.create', 'roles.edit', 'roles.delete', 'roles.view',
    // Services (Local)
    'servicios.create_local', 'servicios.edit_local', 'servicios.delete_local', 'servicios.view_local',
    // Tickets
    'tickets.create', 'tickets.view_all', 'tickets.view_assigned', 'tickets.view_created', 'tickets.assign', 'tickets.change_status',
    // Global Tickets (Explicitly requested)
    'tickets.create_global'
];

// Ensure tickets.create_global exists in map or map correctly
// Iterate over permissions map and filter
export const COMPANY_GROUPED_PERMISSIONS = Object.entries(PERMISSIONS_MAP)
    .filter(([key]) => {
        // Include strict list
        if (COMPANY_PERMISSIONS_LIST.includes(key)) return true;

        // Include subsets if needed? No, strict list is safer.
        // Wait, 'tickets.create_global' isn't in the original map! 
        // original map has: tickets.create, tickets.manage_global, etc.
        // The user asked for "crear tickets globales del sistema". 
        // Looking at map: 'tickets.manage_global' is "Gestión Global Tickets". 
        // Maybe they imply 'tickets.create' + scope selection? 
        // Or we need to add a specific 'tickets.create_global' permission if it doesn't exist?
        // Let's check keys in map: 'tickets.view_all_global', 'tickets.manage_global', 'tickets.delete_global'.
        // No 'tickets.create_global'.
        // However, 'tickets.create' is generic.
        // Ref Implementation Plan: "Users with tickets.create_global permission...".
        // Use 'tickets.manage_global' as proxy or add new key? 
        // Existing keys: tickets.manage_global (Group: Tickets Global). 
        // Using that for now.
        return false;
    })
    .reduce((acc, [key, value]) => {
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
