export const PERMISSIONS = {
    // --- USUARIOS ---
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',

    // --- ROLES ---
    ROLES_VIEW: 'roles.view',
    ROLES_MANAGE: 'roles.manage',

    // --- EMPRESAS (CLIENTS) ---
    COMPANY_USERS_VIEW: 'company.users.view',
    COMPANY_USERS_MANAGE: 'company.users.manage', // Create, Edit, Delete internal users

    // --- TICKETS ---
    TICKETS_VIEW_ALL: 'tickets.view_all',         // Global Admin
    TICKETS_VIEW_COMPANY: 'tickets.view_company', // See all tickets for MY company
    TICKETS_VIEW_OWN: 'tickets.view_own',         // See only MY tickets
    TICKETS_VIEW_ASSIGNED: 'tickets.view_assigned', // See tickets assigned to me

    TICKETS_CREATE: 'tickets.create',
    TICKETS_EDIT: 'tickets.edit',
    TICKETS_DELETE: 'tickets.delete',
    TICKETS_ASSIGN: 'tickets.assign',             // Ability to assign tickets

    // --- SYSTEM ---
    DASHBOARD_VIEW: 'dashboard.view',
    COMPANY_MANAGE: 'company.manage',             // Manage other companies (Super Admin)
    HABILITIES_MANAGE: 'habilities.manage',
    HABILITIES_VIEW: 'habilities.view'
};

export const MODULES = {
    USERS: 'Usuarios',
    ROLES: 'Roles',
    TICKETS: 'Tickets',
    COMPANY: 'Empresa',
    DASHBOARD: 'Dashboard'
};

export const PERMISSION_GROUPS = [
    {
        module: MODULES.USERS,
        permissions: [
            { key: PERMISSIONS.USERS_VIEW, label: 'Ver Usuarios (Global)' },
            { key: PERMISSIONS.USERS_CREATE, label: 'Crear Usuarios (Global)' },
            { key: PERMISSIONS.USERS_EDIT, label: 'Editar Usuarios (Global)' },
            { key: PERMISSIONS.USERS_DELETE, label: 'Eliminar Usuarios (Global)' },
            { key: PERMISSIONS.COMPANY_USERS_VIEW, label: 'Ver Usuarios (Mi Empresa)' },
            { key: PERMISSIONS.COMPANY_USERS_MANAGE, label: 'Gestionar Usuarios (Mi Empresa)' },
        ]
    },
    {
        module: MODULES.ROLES,
        permissions: [
            { key: PERMISSIONS.ROLES_VIEW, label: 'Ver Roles' },
            { key: PERMISSIONS.ROLES_MANAGE, label: 'Gestionar Roles' }
        ]
    },
    {
        module: MODULES.TICKETS,
        permissions: [
            { key: PERMISSIONS.TICKETS_VIEW_ALL, label: 'Ver TODOS los Tickets (Global)' },
            { key: PERMISSIONS.TICKETS_VIEW_COMPANY, label: 'Ver Tickets de mi Empresa' },
            { key: PERMISSIONS.TICKETS_VIEW_OWN, label: 'Ver Mis Tickets' },
            { key: PERMISSIONS.TICKETS_VIEW_ASSIGNED, label: 'Ver Tickets Asignados' },
            { key: PERMISSIONS.TICKETS_CREATE, label: 'Crear Tickets' },
            { key: PERMISSIONS.TICKETS_EDIT, label: 'Editar Tickets' },
            { key: PERMISSIONS.TICKETS_DELETE, label: 'Eliminar Tickets' },
            { key: PERMISSIONS.TICKETS_ASSIGN, label: 'Asignar Tickets' }
        ]
    }
];
