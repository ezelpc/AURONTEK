import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useUIStore } from '@/components/ui.store';

// Basic translations
const resources = {
    en: {
        translation: {
            "common": {
                "dashboard": "Dashboard",
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "create": "Create",
                "search": "Search",
                "filter": "Filter",
                "actions": "Actions",
                "new": "New",
                "active": "Active",
                "inactive": "Inactive",
                "suspended": "Suspended",
                "all": "All",
                "loading": "Loading...",
                "no_data": "No data found.",
                "confirm_delete": "Are you sure you want to delete this item?",
                "irreversible_action": "This action cannot be undone.",
                "delete_permanently": "Delete Permanently",
                "optional": "Optional",
                "required": "Required",
                "success": "Success",
                "error": "Error",
                "yes": "Yes",
                "no": "No",
                "status": "Status",
                "theme": "Theme",
                "language": "Language",
                "logout": "Logout",
                "available": "Available",
                "busy": "Busy",
                "light": "Light",
                "dark": "Dark",
                "system": "System",
                "nav": {
                    "dashboard": "Dashboard",
                    "companies": "Companies",
                    "users": "Users",
                    "users_local": "Local Users",
                    "users_global": "Global Users",
                    "tickets": "Tickets",
                    "tickets_local": "Local Tickets",
                    "tickets_global": "Global Tickets",
                    "services": "Services",
                    "services_local": "Local Services",
                    "services_global": "Global Services",
                    "care_groups": "Care Groups",
                    "system": "System",
                    "roles": "Roles",
                    "admins": "Admins"
                }
            },
            "companies": {
                "title": "Companies Management",
                "subtitle": "Manage your clients and their licenses.",
                "new_company": "New Company",
                "edit_company": "Edit Company",
                "table": {
                    "name": "Name",
                    "rfc": "RFC",
                    "contact": "Contact",
                    "access_code": "Access Code",
                    "plan": "Plan",
                    "status": "Status"
                },
                "dialogs": {
                    "toggle_license_title": "{{status}} License",
                    "toggle_license_desc": "Are you sure you want to {{status}} the license for {{name}}?",
                    "regenerate_code_title": "Regenerate Access Code",
                    "regenerate_code_desc": "Are you sure you want to regenerate the access code for {{name}}? The old code will stop working immediately.",
                    "delete_title": "Delete Company",
                    "delete_desc": "Are you sure you want to delete {{name}}? This will remove all associated users, tickets, and configurations.",
                    "protected_action_title": "Protected Action",
                    "protected_action_desc": "This company requires additional authentication. Enter admin password."
                },
                "form": {
                    "name": "Company Name",
                    "rfc": "RFC",
                    "email": "Email",
                    "address": "Address",
                    "phone": "Phone",
                    "plan": "Subscription Plan",
                    "users_limit": "Users Limit",
                    "storage_limit": "Storage Limit (GB)"
                }
            },
            "admins": {
                "title": "System Admins",
                "subtitle": "Manage Aurontek internal team.",
                "new_admin": "New Admin",
                "edit_admin": "Edit Admin",
                "table": {
                    "name": "Name",
                    "email": "Email",
                    "role": "Role",
                    "permissions": "Permissions",
                    "status": "Status"
                },
                "roles": {
                    "super_admin": "Super Admin",
                    "sub_root": "Sub-Root"
                },
                "tooltips": {
                    "total_access": "Full System Access",
                    "no_permissions": "No permissions assigned"
                }
            },
            "roles": {
                "title": "Roles Management",
                "subtitle": "Manage access profiles and system permissions.",
                "new_role": "New Role",
                "edit_role": "Edit Role",
                "table": {
                    "name": "Name",
                    "description": "Description",
                    "scope": "Scope",
                    "level": "Level"
                },
                "form": {
                    "name": "Role Name",
                    "description": "Description",
                    "permissions": "Permissions",
                    "select_all": "Select All",
                    "select_none": "Select None"
                }
            },
            "auth": {
                "login": "Login",
                "password": "Password",
                "forgot_password": "Forgot Password?",
                "access_code": "Access Code",
                "verify": "Verify",
                "welcome": "Welcome back"
            },
            "validation": {
                "required": "This field is required",
                "invalid_email": "Invalid email address",
                "password_mismatch": "Passwords do not match",
                "min_length": "Must be at least {{min}} characters"
            },
            "services": {
                "title": "Services Catalog",
                "subtitle": "Manage service offerings for tickets.",
                "title_internal": "Internal Services Catalog",
                "new_service": "New Service",
                "edit_service": "Edit Service",
                "import": "Import",
                "template": "Template",
                "tabs": {
                    "global": "Global (Aurontek)",
                    "local": "Internal"
                },
                "table": {
                    "name": "Name",
                    "type": "Type",
                    "priority": "Priority",
                    "sla": "SLA",
                    "status": "Status"
                },
                "messages": {
                    "deleted": "Service deleted",
                    "delete_error": "Error deleting service",
                    "upload_success": "Bulk upload completed: {{msg}}",
                    "upload_error": "Bulk upload error",
                    "no_data": "No services found in this category."
                }
            },
            "users": {
                "title": "Users Management",
                "title_local": "Local Users",
                "title_global": "Global Directory",
                "subtitle_local": "Internal Aurontek staff (Admins and staff)",
                "subtitle_global": "Users from registered client companies",
                "subtitle": "Identity and access management.",
                "search_placeholder": "Search users...",
                "filter_company": "All Companies",
                "new_user": "New User",
                "edit_user": "Edit User",
                "filtered": "Filtered",
                "active_search": "Active Search",
                "count": "{{count}} users",
                "form": {
                    "title_create": "Create User",
                    "title_edit": "Edit User",
                    "desc_create": "Create a new user assigning a company and role.",
                    "desc_edit": "Modify user data.",
                    "auto_password": "A password will be automatically generated and sent to the user's email.",
                    "photo": "Photo",
                    "change_photo": "Change Photo",
                    "upload_photo": "Upload Photo",
                    "photo_help": "JPG, PNG or GIF (max 2MB)",
                    "fullname": "Full Name",
                    "email": "Email",
                    "phone": "Phone",
                    "position": "Position",
                    "company": "Company",
                    "select_company": "Select company",
                    "role": "Role",
                    "select_role": "Select role",
                    "select_company_first": "First select a company",
                    "care_groups": "Care Groups",
                    "select_groups": "Select groups",
                    "active": "Active user",
                    "create_btn": "Create User",
                    "update_btn": "Update User",
                    "uploading": "Uploading photo..."
                },
                "table": {
                    "user": "User / Email",
                    "company": "Company",
                    "role_position": "Role / Position",
                    "permissions": "Permissions",
                    "status": "Status",
                    "no_data": "No users found"
                }
            },
            "company_portal": {
                "dashboard": {
                    "welcome": "Welcome, {{name}}",
                    "summary": "Activity summary for {{company}}",
                    "new_ticket": "New Ticket",
                    "stats": {
                        "total": "Total Tickets",
                        "total_desc": "Total history",
                        "open": "Open",
                        "open_desc": "Require attention",
                        "in_process": "In Process",
                        "in_process_desc": "Being attended",
                        "closed": "Closed",
                        "closed_desc": "Successfully resolved"
                    },
                    "recent_activity": {
                        "title": "Recent Activity",
                        "desc": "Latest created or updated tickets.",
                        "no_activity": "No recent activity.",
                        "create_first": "Create first ticket"
                    },
                    "quick_actions": {
                        "title": "Quick Actions",
                        "catalog": "View Catalog",
                        "catalog_desc": "Explore available services",
                        "team": "My Team",
                        "team_desc": "Manage local users"
                    }
                },
                "create_ticket": {
                    "title": "Report Incident or Requirement",
                    "subtitle": "Select a service from the catalog to autocomplete information.",
                    "select_service_label": "What service do you need?",
                    "select_placeholder": "Select from catalog...",
                    "category": "Category",
                    "sla": "Estimated SLA",
                    "subject": "Subject",
                    "subject_placeholder": "Brief summary...",
                    "description": "Detailed Description",
                    "description_placeholder": "Describe the problem, include error messages or steps to reproduce...",
                    "evidence_note": "You can attach evidence in the ticket detail after creation.",
                    "error_select_service": "Please select a service",
                    "creating": "Creating...",
                    "create_btn": "Create Ticket",
                    "success": "Ticket created successfully",
                    "error": "Error creating ticket"
                }
            }
        }
    },
    es: {
        translation: {
            "common": {
                "dashboard": "Tablero",
                "save": "Guardar",
                "cancel": "Cancelar",
                "delete": "Eliminar",
                "edit": "Editar",
                "create": "Crear",
                "search": "Buscar",
                "filter": "Filtrar",
                "actions": "Acciones",
                "new": "Nuevo",
                "active": "Activo",
                "inactive": "Inactive",
                "suspended": "Suspendido",
                "all": "Todos",
                "loading": "Cargando...",
                "no_data": "No se encontraron datos.",
                "confirm_delete": "¿Estás seguro de que deseas eliminar este elemento?",
                "irreversible_action": "Esta acción no se puede deshacer.",
                "delete_permanently": "Eliminar Permanentemente",
                "optional": "Opcional",
                "required": "Requerido",
                "success": "Éxito",
                "error": "Error",
                "yes": "Sí",
                "no": "No",
                "status": "Estado",
                "theme": "Tema",
                "language": "Idioma",
                "logout": "Cerrar Sesión",
                "available": "Disponible",
                "busy": "Ocupado",
                "light": "Claro",
                "dark": "Oscuro",
                "system": "Sistema",
                "nav": {
                    "dashboard": "Tablero",
                    "companies": "Empresas",
                    "users": "Usuarios",
                    "users_local": "Usuarios Locales",
                    "users_global": "Usuarios Globales",
                    "tickets": "Tickets",
                    "tickets_local": "Tickets Locales",
                    "tickets_global": "Tickets Globales",
                    "services": "Servicios",
                    "services_local": "Servicios Locales",
                    "services_global": "Servicios Globales",
                    "care_groups": "Grupos de Atención",
                    "system": "Sistema",
                    "roles": "Roles",
                    "admins": "Administradores"
                }
            },
            "companies": {
                "title": "Gestión de Empresas",
                "subtitle": "Administra a tus clientes y sus licencias.",
                "new_company": "Nueva Empresa",
                "edit_company": "Editar Empresa",
                "table": {
                    "name": "Nombre",
                    "rfc": "RFC",
                    "contact": "Contacto",
                    "access_code": "Cód. Acceso",
                    "plan": "Plan",
                    "status": "Estado"
                },
                "dialogs": {
                    "toggle_license_title": "{{status}} Licencia",
                    "toggle_license_desc": "¿Estás seguro de que deseas {{status}} la licencia de {{name}}?",
                    "regenerate_code_title": "Regenerar Código de Acceso",
                    "regenerate_code_desc": "¿Estás seguro de regenerar el código para {{name}}? El código anterior dejará de funcionar inmediatamente.",
                    "delete_title": "Eliminar Empresa",
                    "delete_desc": "¿Estás seguro de eliminar {{name}}? Se eliminarán todos los usuarios, tickets y configuraciones asociados.",
                    "protected_action_title": "Acción Protegida",
                    "protected_action_desc": "Esta empresa requiere autenticación adicional. Ingresa la contraseña de administrador."
                },
                "form": {
                    "name": "Nombre Empresa",
                    "rfc": "RFC",
                    "email": "Correo Electrónico",
                    "address": "Dirección",
                    "phone": "Teléfono",
                    "plan": "Plan de Suscripción",
                    "users_limit": "Límite de Usuarios",
                    "storage_limit": "Límite de Almacenamiento (GB)"
                }
            },
            "admins": {
                "title": "Administradores del Sistema",
                "subtitle": "Gestiona al equipo interno de Aurontek.",
                "new_admin": "Nuevo Admin",
                "edit_admin": "Editar Admin",
                "table": {
                    "name": "Nombre",
                    "email": "Correo",
                    "role": "Rol",
                    "permissions": "Permisos",
                    "status": "Estado"
                },
                "roles": {
                    "super_admin": "Super Admin",
                    "sub_root": "Sub-Root"
                },
                "tooltips": {
                    "total_access": "Acceso Total al Sistema",
                    "no_permissions": "Sin permisos asignados"
                }
            },
            "roles": {
                "title": "Gestión de Roles",
                "subtitle": "Administra los perfiles de acceso y permisos del sistema.",
                "new_role": "Nuevo Rol",
                "edit_role": "Editar Rol",
                "table": {
                    "name": "Nombre",
                    "description": "Descripción",
                    "scope": "Alcance",
                    "level": "Nivel"
                },
                "form": {
                    "name": "Nombre del Rol",
                    "description": "Descripción",
                    "permissions": "Permisos",
                    "select_all": "Todos",
                    "select_none": "Ninguno"
                }
            },
            "auth": {
                "login": "Iniciar Sesión",
                "password": "Contraseña",
                "forgot_password": "¿Olvidaste tu contraseña?",
                "access_code": "Código de Acceso",
                "verify": "Verificar",
                "welcome": "Bienvenido de nuevo"
            },
            "validation": {
                "required": "Este campo es requerido",
                "invalid_email": "Correo inválido",
                "password_mismatch": "Las contraseñas no coinciden",
                "min_length": "Debe tener al menos {{min}} caracteres"
            },
            "services": {
                "title": "Catálogo de Servicios",
                "subtitle": "Gestiona la oferta de servicios para tickets.",
                "title_internal": "Catálogo de Servicios Interno",
                "new_service": "Nuevo Servicio",
                "edit_service": "Editar Servicio",
                "import": "Importar",
                "template": "Plantilla",
                "tabs": {
                    "global": "Globales (Aurontek)",
                    "local": "Internos"
                },
                "table": {
                    "name": "Nombre",
                    "type": "Tipo",
                    "priority": "Prioridad",
                    "sla": "SLA",
                    "status": "Estado"
                },
                "messages": {
                    "deleted": "Servicio eliminado",
                    "delete_error": "Error al eliminar servicio",
                    "upload_success": "Carga masiva completada: {{msg}}",
                    "upload_error": "Error en carga masiva",
                    "no_data": "No hay servicios registrados en esta categoría."
                }
            },
            "users": {
                "title": "Gestión de Usuarios",
                "title_local": "Usuarios Locales",
                "title_global": "Directorio Global",
                "subtitle_local": "Personal interno de Aurontek (Administradores y personal)",
                "subtitle_global": "Usuarios de empresas clientes registradas",
                "subtitle": "Administración de identidades y accesos.",
                "search_placeholder": "Buscar usuarios...",
                "filter_company": "Todas las Empresas",
                "new_user": "Nuevo Usuario",
                "edit_user": "Editar Usuario",
                "filtered": "Filtrado",
                "active_search": "Búsqueda activa",
                "count": "{{count}} usuarios",
                "form": {
                    "title_create": "Alta de Usuario",
                    "title_edit": "Editar Usuario",
                    "desc_create": "Crea un nuevo usuario asignándole una empresa y rol.",
                    "desc_edit": "Modifica los datos del usuario.",
                    "auto_password": "Se generará una contraseña automáticamente y se enviará al correo del usuario.",
                    "photo": "Foto",
                    "change_photo": "Cambiar Foto",
                    "upload_photo": "Subir Foto",
                    "photo_help": "JPG, PNG o GIF (máx. 2MB)",
                    "fullname": "Nombre Completo",
                    "email": "Correo Electrónico",
                    "phone": "Teléfono",
                    "position": "Puesto",
                    "company": "Empresa",
                    "select_company": "Seleccionar empresa",
                    "role": "Rol",
                    "select_role": "Seleccionar rol",
                    "select_company_first": "Primero selecciona una empresa",
                    "care_groups": "Grupos de Atención",
                    "select_groups": "Seleccionar grupos",
                    "active": "Usuario activo",
                    "create_btn": "Crear Usuario",
                    "update_btn": "Actualizar Usuario",
                    "uploading": "Subiendo foto..."
                },
                "table": {
                    "user": "Nombre / Email",
                    "company": "Empresa",
                    "role_position": "Rol / Puesto",
                    "permissions": "Permisos",
                    "status": "Estado",
                    "no_data": "No se encontraron usuarios"
                }
            },
            "company_portal": {
                "dashboard": {
                    "welcome": "Bienvenido, {{name}}",
                    "summary": "Resumen de actividad para {{company}}",
                    "new_ticket": "Nuevo Ticket",
                    "stats": {
                        "total": "Total Tickets",
                        "total_desc": "Histórico total",
                        "open": "Abiertos",
                        "open_desc": "Requieren atención",
                        "in_process": "En Proceso",
                        "in_process_desc": "Siendo atendidos",
                        "closed": "Cerrados",
                        "closed_desc": "Resueltos exitosamente"
                    },
                    "recent_activity": {
                        "title": "Actividad Reciente",
                        "desc": "Últimos tickets creados o actualizados.",
                        "no_activity": "No hay actividad reciente.",
                        "create_first": "Crear primer ticket"
                    },
                    "quick_actions": {
                        "title": "Accesos Directos",
                        "catalog": "Ver Catálogo",
                        "catalog_desc": "Explorar servicios disponibles",
                        "team": "Mi Equipo",
                        "team_desc": "Gestionar usuarios locales"
                    }
                },
                "create_ticket": {
                    "title": "Reportar Incidente o Requerimiento",
                    "subtitle": "Selecciona el servicio del catálogo para autocompletar la información.",
                    "select_service_label": "¿Qué servicio necesitas?",
                    "select_placeholder": "Selecciona del catálogo...",
                    "category": "Categoría",
                    "sla": "SLA Estimado",
                    "subject": "Asunto",
                    "subject_placeholder": "Resumen breve...",
                    "description": "Descripción Detallada",
                    "description_placeholder": "Describe el problema, incluye mensajes de error o pasos para reproducirlo...",
                    "evidence_note": "Puedes adjuntar evidencias en el detalle del ticket una vez creado.",
                    "error_select_service": "Por favor selecciona un servicio",
                    "creating": "Creando...",
                    "create_btn": "Crear Ticket",
                    "success": "Ticket creado exitosamente",
                    "error": "Error al crear ticket"
                }
            }
        }
    }
};

// Get initial language from store (localStorage)
const storedLang = JSON.parse(localStorage.getItem('ui-storage') || '{}')?.state?.language || 'es';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: storedLang,
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        }
    });

// Subscribe to store changes to update i18n
useUIStore.subscribe((state) => {
    if (state.language !== i18n.language) {
        i18n.changeLanguage(state.language);
    }
});

export default i18n;
