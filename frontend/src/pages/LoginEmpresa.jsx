import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  FormControlLabel, Checkbox, Link
} from '@mui/material';
import ReCAPTCHA from "react-google-recaptcha";
import { loginEmpresa } from '../services/empresaService';

const LoginEmpresa = () => {
  const navigate = useNavigate();
  const [credenciales, setCredenciales] = useState({ correo: '', contraseña: '' });
  const [error, setError] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState('Tech Solutions');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const codigo = sessionStorage.getItem('empresa_acceso');
    const nombre = sessionStorage.getItem('empresa_nombre');

    // Si no hay código en session, verificar si hay código guardado válido
    if (!codigo) {
      const codigoGuardado = localStorage.getItem('empresa_codigo_guardado');
      const fechaExpiracion = localStorage.getItem('empresa_codigo_expiracion');

      if (codigoGuardado && fechaExpiracion) {
        const ahora = new Date().getTime();
        const expira = parseInt(fechaExpiracion);

        if (ahora < expira) {
          // Código válido, guardarlo en session y continuar
          sessionStorage.setItem('empresa_acceso', codigoGuardado);
        } else {
          // Código expirado, redirigir a validar
          localStorage.removeItem('empresa_codigo_guardado');
          localStorage.removeItem('empresa_codigo_expiracion');
          navigate('/acceso-empresa');
          return;
        }
      } else {
        // No hay código guardado, redirigir a validar
        navigate('/acceso-empresa');
        return;
      }
    }

    if (nombre) setNombreEmpresa(nombre);

    // Cargar correo recordado
    const correoGuardado = localStorage.getItem('empresa_email_recordado');
    if (correoGuardado) {
      setCredenciales(prev => ({ ...prev, correo: correoGuardado }));
      setRecordar(true);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!recaptchaToken) {
      setError('Por favor, completa el ReCAPTCHA.');
      return;
    }

    try {
      const res = await loginEmpresa({
        ...credenciales,
        recaptchaToken
      });

      if (res.ok) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));

        if (recordar) {
          localStorage.setItem('empresa_email_recordado', credenciales.correo);
        } else {
          localStorage.removeItem('empresa_email_recordado');
        }

        navigate('/empresa/dashboard');
      }
    } catch (err) {
      setError(err.msg || 'Credenciales incorrectas o usuario no activo.');
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
    }
  };

  const onChangeRecaptcha = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f4f8' }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
          {nombreEmpresa}
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Bienvenido al portal corporativo
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth margin="normal" label="Correo Corporativo"
            value={credenciales.correo}
            onChange={(e) => setCredenciales({ ...credenciales, correo: e.target.value })}
            required
          />
          <TextField
            fullWidth margin="normal" label="Contraseña" type="password"
            value={credenciales.contraseña}
            onChange={(e) => setCredenciales({ ...credenciales, contraseña: e.target.value })}
            required
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Recordarme</Typography>}
            />
            <Link href="#" variant="body2" underline="hover" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={onChangeRecaptcha}
            />
          </Box>

          <Button type="submit" fullWidth variant="contained" size="large">
            Iniciar Sesión
          </Button>
        </form>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: '#888' }}>
          Password (test): password123
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginEmpresa;