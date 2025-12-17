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
    'admins.manage': { label: 'Gestionar Admins', description: 'Control total de administradores', group: 'Sistema' },
    'habilities.view': { label: 'Ver Habilidades', description: 'Listar habilidades', group: 'Habilidades' },
    'habilities.manage': { label: 'Gestionar Habilidades', description: 'CRUD habilidades', group: 'Habilidades' },
};

export const GROUPED_PERMISSIONS = Object.entries(PERMISSIONS_MAP).reduce((acc, [key, value]) => {
    if (!acc[value.group]) acc[value.group] = [];
    acc[value.group].push({ key, ...value });
    return acc;
}, {} as Record<string, (typeof PERMISSIONS_MAP[string] & { key: string })[]>);
