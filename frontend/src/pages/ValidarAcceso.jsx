import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Alert,
  FormControlLabel, Checkbox, Stack
} from '@mui/material';
import { VpnKey as KeyIcon, ArrowForward } from '@mui/icons-material';
import { validarCodigoAcceso } from '../services/empresaService';

const ValidarAcceso = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState(new Array(8).fill(""));
  const [error, setError] = useState('');
  const [recordar, setRecordar] = useState(false);
  const inputRefs = useRef([]);

  // 1. EFECTO: Verificar si hay un código recordado válido al iniciar
  useEffect(() => {
    // Solo auto-redirigir si NO hay un usuario logueado
    const usuarioLogueado = localStorage.getItem('usuario');
    if (usuarioLogueado) {
      return;
    }

    const codigoGuardado = localStorage.getItem('empresa_codigo_guardado');
    const fechaExpiracion = localStorage.getItem('empresa_codigo_expiracion');

    if (codigoGuardado && fechaExpiracion) {
      const ahora = new Date().getTime();
      const expira = parseInt(fechaExpiracion);

      if (ahora < expira) {
        // Código válido, auto-validar y redirigir
        validarCodigoAcceso(codigoGuardado)
          .then((res) => {
            sessionStorage.setItem('empresa_acceso', codigoGuardado);
            if (res.empresa && res.empresa.nombre) {
              sessionStorage.setItem('empresa_nombre', res.empresa.nombre);
            }
            navigate('/empresa/login');
          })
          .catch(() => {
            // Código inválido, limpiar
            localStorage.removeItem('empresa_codigo_guardado');
            localStorage.removeItem('empresa_codigo_expiracion');
          });
      } else {
        // Código expirado, limpiar
        localStorage.removeItem('empresa_codigo_guardado');
        localStorage.removeItem('empresa_codigo_expiracion');
      }
    }
  }, [navigate]);

  const handleChange = (element, index) => {
    // Permitir letras y números
    if (!/^[a-zA-Z0-9]*$/.test(element.value)) return false;

    const newCodigo = [...codigo];
    newCodigo[index] = element.value;
    setCodigo(newCodigo);

    // Auto-focus next input
    if (element.value && index < 7) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 8).split("");
    const newCodigo = [...codigo];
    pastedData.forEach((char, index) => {
      if (index < 8) newCodigo[index] = char;
    });
    setCodigo(newCodigo);
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 7)].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const codigoFinal = codigo.join("");

    if (codigoFinal.length < 6) {
      setError('El código debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const res = await validarCodigoAcceso(codigoFinal);

      sessionStorage.setItem('empresa_acceso', codigoFinal);
      if (res.empresa && res.empresa.nombre) {
        sessionStorage.setItem('empresa_nombre', res.empresa.nombre);
      }

      if (recordar) {
        // Guardar código con fecha de expiración de 25 días
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 25);
        localStorage.setItem('empresa_codigo_guardado', codigoFinal);
        localStorage.setItem('empresa_codigo_expiracion', fechaExpiracion.getTime().toString());
      } else {
        localStorage.removeItem('empresa_codigo_guardado');
        localStorage.removeItem('empresa_codigo_expiracion');
      }

      navigate('/empresa/login');

    } catch (err) {
      setError(err.msg || err.error || 'Código de acceso inválido o expirado.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0b2f5b' }}>
      <Paper elevation={6} sx={{ p: 5, maxWidth: 600, width: '90%', textAlign: 'center', borderRadius: 3 }}>
        <KeyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Acceso Empresarial</Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Ingresa el código de acceso único proporcionado en tu correo de bienvenida.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            {codigo.map((data, index) => (
              <input
                key={index}
                type="text"
                name="codigo"
                maxLength="1"
                value={data}
                ref={el => inputRefs.current[index] = el}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onPaste={handlePaste}
                style={{
                  width: '40px',
                  height: '50px',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  outline: 'none'
                }}
              />
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="body2" color="textSecondary">Recordar este código por 25 días</Typography>}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            Continuar al Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ValidarAcceso;