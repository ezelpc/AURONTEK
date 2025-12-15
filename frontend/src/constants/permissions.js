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
    COMPANY_MANAGE: 'company.manage',             // Manage other companies (Select Company in dropdown)
    HABILITIES_MANAGE: 'habilities.manage',
    HABILITIES_VIEW: 'habilities.view'
};
