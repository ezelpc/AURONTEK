import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button, Alert,
    Container, CssBaseline
} from '@mui/material';
import ReCAPTCHA from "react-google-recaptcha";
import { loginAdmin } from '../../services/adminAuthService';
import LockPersonIcon from '@mui/icons-material/LockPerson';

const LoginAdmin = () => {
    const navigate = useNavigate();
    const [credenciales, setCredenciales] = useState({ correo: '', contraseña: '' });
    const [error, setError] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!recaptchaToken) {
            setError('Por favor, completa el ReCAPTCHA.');
            return;
        }

        try {
            const res = await loginAdmin({
                ...credenciales,
                captchaToken: recaptchaToken // Match backend expectation
            });

            if (res.ok) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('usuario', JSON.stringify(res.usuario));
                // Redirect to Admin Dashboard
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.msg || 'Credenciales inválidas.');
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
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 2, bgcolor: '#0f172a', color: 'white' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <LockPersonIcon sx={{ fontSize: 40, color: '#38bdf8', mb: 1 }} />
                        <Typography component="h1" variant="h5" fontWeight="bold">
                            Admin Portal
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Solo Personal Autorizado
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Correo Administrativo"
                            autoComplete="email"
                            autoFocus
                            value={credenciales.correo}
                            onChange={(e) => setCredenciales({ ...credenciales, correo: e.target.value })}
                            sx={{
                                input: { color: 'white' },
                                label: { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#334155' },
                                    '&:hover fieldset': { borderColor: '#38bdf8' },
                                }
                            }}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Contraseña"
                            type="password"
                            autoComplete="current-password"
                            value={credenciales.contraseña}
                            onChange={(e) => setCredenciales({ ...credenciales, contraseña: e.target.value })}
                            sx={{
                                input: { color: 'white' },
                                label: { color: '#94a3b8' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#334155' },
                                    '&:hover fieldset': { borderColor: '#38bdf8' },
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                theme="dark"
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={onChangeRecaptcha}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, bgcolor: '#38bdf8', '&:hover': { bgcolor: '#0ea5e9' } }}
                        >
                            Acceder
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginAdmin;
