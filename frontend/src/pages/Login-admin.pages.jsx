import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import logo from '../assets/logoArutontek.png';
import {
  Box, Paper, Typography, TextField, Button,
  Checkbox, FormControlLabel, Link, Alert,
  InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText,
  DialogActions, CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { login } from '../services/authService';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState(() => localStorage.getItem('recuerdo_correo') || '');
  const [contraseña, setContraseña] = useState(() => localStorage.getItem('recuerdo_contraseña') || '');
  const [captchaValue, setCaptchaValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(() => !!localStorage.getItem('recuerdo_correo'));
  const [showWarning, setShowWarning] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const recaptchaKey = process.env.REACT_APP_RECAPTCHA_KEY;

  const onCaptchaChange = (value) => setCaptchaValue(value);
  const handleShowPassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!captchaValue) {
      setErrorMessage('Por favor, completa el CAPTCHA.');
      return;
    }

    if (mantenerSesion) {
      localStorage.setItem('recuerdo_correo', correo);
      localStorage.setItem('recuerdo_contraseña', contraseña);
    } else {
      localStorage.removeItem('recuerdo_correo');
      localStorage.removeItem('recuerdo_contraseña');
    }

    try {
      const data = await login(correo, contraseña, captchaValue, mantenerSesion);

      if (!data.ok) {
        setErrorMessage(data.error);
      } else {
        // Guardamos token y admin
        if (mantenerSesion) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('admin', JSON.stringify(data.admin));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('admin', JSON.stringify(data.admin));
        }

        // Redirigimos al dashboard
        navigate('/', { replace: true });
      }
    } catch {
      setErrorMessage('Error de red al intentar iniciar sesión.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f2f5', p: 2 }}>
      <Paper elevation={6} sx={{ maxWidth: 450, width: '100%', p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img src={logo} alt="Aurontek" style={{ height: 60, marginBottom: 10 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', letterSpacing: 1 }}>AURONTEK</Typography>
          <Typography variant="body2" color="textSecondary">Panel Administrativo</Typography>
        </Box>

        {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth label="Correo electrónico" variant="outlined" margin="normal" type="email" required
            value={correo} onChange={(e) => setCorreo(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>) }}
          />

          <TextField
            fullWidth label="Contraseña" variant="outlined" margin="normal"
            type={showPassword ? 'text' : 'password'} required
            value={contraseña} onChange={(e) => setContraseña(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleShowPassword} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mantenerSesion}
                  onChange={e => setMantenerSesion(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="body2">Recordarme</Typography>}
            />
          </Box>

          {showWarning && <Alert severity="warning" sx={{ mb: 2, fontSize: '0.85rem' }}>No uses "Recordarme" en equipos públicos.</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ReCAPTCHA sitekey={recaptchaKey} onChange={onCaptchaChange} />
          </Box>

          <Button type="submit" fullWidth variant="contained" size="large" startIcon={<LoginIcon />} sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'none', fontSize: '1rem' }}>
            Iniciar Sesión
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginAdmin;
