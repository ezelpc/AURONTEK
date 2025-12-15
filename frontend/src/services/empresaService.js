// Usar la instancia compartida que tiene los interceptores de autenticación
import api from '../api/api.js';

// Claves para LocalStorage
const KEY_EMPRESAS = 'aurontek_empresas_db';
const KEY_USUARIOS = 'aurontek_usuarios_db';
const KEY_TICKETS = 'aurontek_tickets_db';

// ==========================================
// 1. BASE DE DATOS SIMULADA (MOCK DATA)
// ==========================================

const MOCK_EMPRESAS = [
  { 
    id: "emp_001", 
    nombre: "Tech Solutions SA de CV", 
    codigo_acceso: "6KCsUuYT", 
    rfc: "TSO123456789", 
    plan: "Enterprise", 
    estado: true,
    creado: "2025-01-10" 
  },
  { 
    id: "emp_002", 
    nombre: "Consultoría Global S.C.", 
    codigo_acceso: "CONS2025", 
    rfc: "CGL987654321", 
    plan: "Pyme", 
    estado: true,
    creado: "2025-02-15" 
  }
];

const MOCK_USUARIOS = [
  // === EMPRESA 1: TECH SOLUTIONS (emp_001) ===
  { 
    id: "u_101", empresaId: "emp_001", nombre: "Carlos Director", correo: "admin@techsolutions.com", 
    rol: "admin_empresa", permisos: ["all"], puesto: "Director General", estado: true 
  },
  { 
    id: "u_102", empresaId: "emp_001", nombre: "Ana Soporte (Líder)", correo: "soporte@techsolutions.com", 
    rol: "soporte", permisos: ["crear_usuarios", "reasignar_tickets"], puesto: "Líder de Mesa", estado: true 
  },
  { 
    id: "u_103", empresaId: "emp_001", nombre: "Pedro Becario", correo: "becario@techsolutions.com", 
    rol: "becario", permisos: [], puesto: "Practicante Sistemas", estado: true 
  },
  { 
    id: "u_104", empresaId: "emp_001", nombre: "Luisa Ventas (Final)", correo: "usuario@techsolutions.com", 
    rol: "usuario_final", permisos: [], puesto: "Ejecutiva Ventas", estado: true 
  },

  // === EMPRESA 2: CONSULTORÍA GLOBAL (emp_002) ===
  { 
    id: "u_201", empresaId: "emp_002", nombre: "Mariana Gerente", correo: "gerencia@consultoria.com", 
    rol: "admin_empresa", permisos: ["all"], puesto: "Gerente Ops", estado: true 
  },
  { 
    id: "u_202", empresaId: "emp_002", nombre: "Juan IT", correo: "it@consultoria.com", 
    rol: "soporte", permisos: [], puesto: "Soporte Jr", estado: true 
  }
];

const MOCK_TICKETS = [
  { 
    id: 1001, empresaId: "emp_001", creadoPor: "u_104", asignadoA: null, tutor: null,
    asunto: "No puedo imprimir en red", tipo: "Hardware", prioridad: "Media", estado: "Abierto", 
    fecha: "2025-10-28", descripcion: "La impresora del pasillo 2 no aparece en mi lista." 
  },
  { 
    id: 1003, empresaId: "emp_001", creadoPor: "u_101", asignadoA: "u_103", tutor: "u_102",
    asunto: "Instalar Antivirus en Laptops Nuevas", tipo: "Mantenimiento", prioridad: "Baja", estado: "En Proceso", 
    fecha: "2025-10-30", descripcion: "Configurar las 3 laptops nuevas con la licencia corporativa. (Supervisado por Ana)" 
  },
  { 
    id: 2001, empresaId: "emp_002", creadoPor: "u_201", asignadoA: "u_202", tutor: null,
    asunto: "Falla de Internet", tipo: "Redes", prioridad: "Critica", estado: "Abierto", 
    fecha: "2025-10-30", descripcion: "Sin conexión en la sala de juntas." 
  }
];

// ==========================================
// 2. HELPERS LOCALSTORAGE
// ==========================================
const getData = (key, mockData) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : mockData;
};

const setData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// API configurada en la parte superior del archivo

// ==========================================
// 4. FUNCIONES DE AUTENTICACIÓN (REAL API)
// ==========================================

export const validarCodigoAcceso = async (codigo) => {
  const response = await api.post('/auth/validate-code', { codigo });
  return response.data;
};

export const loginEmpresa = async ({ correo, contraseña, recaptchaToken }) => {
  const codigoSesion = sessionStorage.getItem('empresa_acceso');
  
  if (!codigoSesion) {
    return Promise.reject({ msg: 'Sesión de empresa no válida. Ingrese el código nuevamente.' });
  }

  const response = await api.post('/auth/login', {
    email: correo,
    password: contraseña,
    codigoAcceso: codigoSesion,
    recaptchaToken: recaptchaToken || 'token-bypass-dev'
  });
  
  return {
    ok: true,
    token: response.data.token,
    usuario: response.data.admin
  };
};

// ==========================================
// 5. SERVICIOS (MOCK + LOCALSTORAGE)
// ==========================================

export const getTickets = async (filtros = {}, empresaIdFiltro = null) => {
  let tickets = getData(KEY_TICKETS, MOCK_TICKETS);
  const usuarios = getData(KEY_USUARIOS, MOCK_USUARIOS);

  if (!empresaIdFiltro) {
      const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
      empresaIdFiltro = usuarioLogueado.empresaId;
  }

  // Filtrar tickets estrictamente por la empresa del usuario
  if (empresaIdFiltro) {
    tickets = tickets.filter(t => t.empresaId === empresaIdFiltro);
  }

  if (filtros.creadoPor) tickets = tickets.filter(t => t.creadoPor === filtros.creadoPor);
  if (filtros.asignadoA) tickets = tickets.filter(t => t.asignadoA === filtros.asignadoA);

  const ticketsEnriquecidos = tickets.map(t => {
    const asignado = usuarios.find(u => u.id === t.asignadoA);
    const tutor = usuarios.find(u => u.id === t.tutor);
    return {
      ...t,
      nombreAsignado: asignado ? asignado.nombre : 'Sin asignar',
      nombreTutor: tutor ? tutor.nombre : null
    };
  });

  return Promise.resolve(ticketsEnriquecidos);
};

export const crearTicket = async (ticketData) => {
  const tickets = getData(KEY_TICKETS, MOCK_TICKETS);
  // Obtener usuario actual para asignar empresaId automáticamente
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (!usuarioLogueado.empresaId) return Promise.reject({ error: "No hay sesión de usuario válida" });

  const nuevoTicket = {
    id: Math.floor(Math.random() * 100000),
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Abierto',
    asignadoA: null,
    tutor: null,
    empresaId: usuarioLogueado.empresaId, // <--- ASIGNACIÓN AUTOMÁTICA
    creadoPor: usuarioLogueado.id,
    ...ticketData
  };
  setData(KEY_TICKETS, [nuevoTicket, ...tickets]);
  return Promise.resolve({ ok: true, mensaje: 'Ticket creado exitosamente' });
};

export const reasignarTicket = async (ticketId, nuevoAsignadoId, tutorId = null) => {
  const tickets = getData(KEY_TICKETS, MOCK_TICKETS);
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    tickets[index].asignadoA = nuevoAsignadoId;
    tickets[index].tutor = tutorId;
    tickets[index].estado = 'En Proceso';
    setData(KEY_TICKETS, tickets);
    return Promise.resolve({ ok: true, mensaje: 'Ticket reasignado' });
  }
  return Promise.reject({ error: 'Ticket no encontrado' });
};

// ==========================================
// 6. GESTIÓN DE USUARIOS (Filtrado por Empresa)
// ==========================================

export const getUsuarios = async (empresaId = null) => {
  const usuarios = getData(KEY_USUARIOS, MOCK_USUARIOS);
  
  // Si no se pasa ID, usar el del usuario logueado
  if (!empresaId) {
     const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
     empresaId = usuarioLogueado.empresaId;
  }

  if (empresaId) return Promise.resolve(usuarios.filter(u => u.empresaId === empresaId));
  return Promise.resolve(usuarios);
};

export const crearUsuario = async (usuarioData, creador) => {
  if (creador.rol !== 'admin_empresa' && !creador.permisos?.includes('crear_usuarios') && creador.rol !== 'superadmin') {
    return Promise.reject({ error: 'No tienes permisos para crear usuarios.' });
  }
  
  const usuarios = getData(KEY_USUARIOS, MOCK_USUARIOS);
  const nuevoUsuario = {
    id: `u_${Date.now()}`,
    estado: true,
    permisos: [],
    empresaId: creador.empresaId, // <--- HEREDA LA EMPRESA DEL CREADOR
    ...usuarioData
  };
  setData(KEY_USUARIOS, [...usuarios, nuevoUsuario]);
  return Promise.resolve({ ok: true, mensaje: 'Usuario creado correctamente' });
};

// ==========================================
// 7. FUNCIONES ADMIN SISTEMA (SuperAdmin)
// ==========================================

// --- 7. FUNCIONES ADMIN SISTEMA (REAL API) ---

export const registrarEmpresa = async (empresaData, token) => {
  // Map frontend data structure to backend expected structure
  // Backend expects:
  // - nombreEmpresa, rfc, direccion, telefono, correo
  // - plan, fecha_inicio
  // - nombreContratante, telefonoContratante, puestoContratante
  // - nombreAdminInterno, emailAdminInterno, passwordAdminInterno

  // We map 'contratante' data to both 'contratante' and 'adminInterno' fields 
  // because the frontend assumes the contractor IS the admin.
  // And we generate a temporary password here or let the user decide?
  // Frontend generated a temp pass in mock logic. Let's do it here or better, 
  // Backend relies on passwordAdminInterno. Frontend modal shows a generated pass.
  // So we generate it here to send to backend AND show in modal.

  const passTemp = Math.random().toString(36).slice(-8);

  const payload = {
    nombreEmpresa: empresaData.nombre_empresa,
    rfc: empresaData.rfc,
    direccion: empresaData.direccion,
    telefono: empresaData.telefono,
    correo: empresaData.correo_contacto,
    
    plan: empresaData.licencia[0].plan,
    fecha_inicio: empresaData.licencia[0].fecha_inicio,

    nombreContratante: empresaData.contratante.nombre,
    telefonoContratante: empresaData.contratante.telefono,
    puestoContratante: empresaData.contratante.puesto,
    
    // Admin Interno defaults to Contratante info
    nombreAdminInterno: empresaData.contratante.nombre,
    emailAdminInterno: empresaData.contratante.correo,
    passwordAdminInterno: passTemp
  };

  try {
    const response = await api.post('/companies', payload);
    
    // Return format expected by RegistrarEmpresa.jsx
    return {
      mensaje: response.data.msg,
      codigo_acceso: response.data.codigo_acceso,
      contratante_usuario: {
        correo: payload.emailAdminInterno,
        contraseña_temporal: passTemp
      }
    };
  } catch (error) {
    console.error('Error al registrar empresa en API:', error);
    throw { error: error.response?.data?.msg || 'Error al conectar con el servidor' };
  }
};

export const getTodasEmpresas = async () => {
  const response = await api.get('/companies');
  return response.data;
};

export const actualizarEmpresa = async (id, datos, hqCode = null) => {
  const payload = hqCode ? { ...datos, hqCode } : datos;
  const response = await api.put(`/companies/${id}`, payload);
  return response.data;
};

export const eliminarEmpresa = async (id, hqCode = null) => {
  const config = hqCode ? { data: { hqCode } } : { data: {} };
  const response = await api.delete(`/companies/${id}`, config);
  return response.data;
};

export const toggleLicenciaEmpresa = async (id, activo) => {
  const response = await api.patch(`/companies/${id}/licencia`, { activo });
  return response.data;
};

export const regenerarCodigoAcceso = async (id) => {
  const response = await api.post(`/companies/${id}/regenerar-codigo`);
  return response.data;
};

// ==========================================
// 8. ALIAS DE COMPATIBILIDAD
// ==========================================
export const getTicketsEmpresa = () => getTickets(); // Ya maneja la lógica interna de obtener ID de sesión
export const getUsuariosEmpresa = () => getUsuarios();
export const crearUsuarioEmpresa = (u) => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    return crearUsuario(u, user);
};
export const crearTicketEmpresa = (t) => crearTicket(t);