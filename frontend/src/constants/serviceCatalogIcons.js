import {
  Computer, Storage, Folder, Apps, Security, Print, Dns, Wifi, Help,
  Email, VpnKey, Assessment, Settings, Phone, Cloud, BugReport,
  Build, Description, Category, Warning, Info, CheckCircle, Error
} from '@mui/icons-material';

// Icon mapping for service categories
export const SERVICE_CATEGORY_ICONS = {
  'Almacenamiento': { icon: Storage, color: '#2196F3' },
  'Aplicaciones internas': { icon: Apps, color: '#9C27B0' },
  'Computo Personal': { icon: Computer, color: '#FF9800' },
  'Correo Electrónico': { icon: Email, color: '#4CAF50' },
  'Correo electrónico': { icon: Email, color: '#4CAF50' },
  'Directorio Activo': { icon: Folder, color: '#795548' },
  'ERP': { icon: Assessment, color: '#E91E63' },
  'Impresión': { icon: Print, color: '#607D8B' },
  'Infraestructura': { icon: Dns, color: '#3F51B5' },
  'Redes': { icon: Wifi, color: '#00BCD4' },
  'Requerimientos Especiales': { icon: Help, color: '#FFC107' },
  'Seguridad': { icon: Security, color: '#F44336' },
  'Sharepoint M365': { icon: Cloud, color: '#4CAF50' },
  'Software': { icon: Settings, color: '#9E9E9E' },
  'Telefonía Fija': { icon: Phone, color: '#009688' }
};

// Icon mapping for service types
export const SERVICE_TYPE_ICONS = {
  'Incidente': { icon: BugReport, color: '#f44336' },
  'Requerimiento': { icon: Description, color: '#2196f3' }
};

// Priority icons
export const PRIORITY_ICONS = {
  'crítica': { icon: Error, color: '#d32f2f' },
  'critica': { icon: Error, color: '#d32f2f' },
  'Alta': { icon: Warning, color: '#f57c00' },
  'alta': { icon: Warning, color: '#f57c00' },
  'Media': { icon: Info, color: '#1976d2' },
  'media': { icon: Info, color: '#1976d2' },
  'Baja': { icon: CheckCircle, color: '#388e3c' },
  'baja': { icon: CheckCircle, color: '#388e3c' }
};

// Helper function to get icon component for a category
export const getCategoryIcon = (categoria) => {
  const config = SERVICE_CATEGORY_ICONS[categoria];
  return config || { icon: Category, color: '#757575' };
};

// Helper function to get icon component for a type
export const getTypeIcon = (tipo) => {
  const config = SERVICE_TYPE_ICONS[tipo];
  return config || { icon: Build, color: '#757575' };
};

// Helper function to get priority icon
export const getPriorityIcon = (prioridad) => {
  const config = PRIORITY_ICONS[prioridad];
  return config || { icon: Info, color: '#757575' };
};
