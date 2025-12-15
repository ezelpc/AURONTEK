import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Intentamos obtener "admin" (Sistema) o "usuario" (Empresa)
  const userStr = localStorage.getItem('admin') || sessionStorage.getItem('admin') ||
    localStorage.getItem('usuario') || sessionStorage.getItem('usuario');

  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere roles específicos y el usuario no lo tiene
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Redirigir según su rol real para no dejarlo en el limbo
    if (user.rol === 'superadmin') return <Navigate to="/dashboard" />;
    if (user.rol === 'admin_empresa') return <Navigate to="/empresa/dashboard" />;
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;