import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { authService } from '@/auth/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserCircle, LogIn, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import ReCAPTCHA from "react-google-recaptcha";

const LoginEmpresa = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Obtener codigo del state (navegación anterior) o del localStorage
    const codigoAccesoFromState = location.state?.codigo;
    const codigoAccesoFromStorage = localStorage.getItem('companyAccessCode');
    const codigoAcceso = codigoAccesoFromState || codigoAccesoFromStorage;
    const empresaNombre = location.state?.empresaNombre; // Recuperamos nombre

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberUser, setRememberUser] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!codigoAcceso) {
            // Si no hay código ni en state ni en localStorage, volver a validación
            navigate('/acceso-empresa');
            return;
        }

        // Cargar email guardado si existe
        const savedEmail = localStorage.getItem('aurontek_empresa_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberUser(true);
        }
    }, [codigoAcceso, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const captchaToken = recaptchaRef.current?.getValue();

        if (!captchaToken) {
            setError('Por favor completa el ReCAPTCHA.');
            setIsLoading(false);
            return;
        }

        try {
            const data = await authService.loginEmpresa(email, password, codigoAcceso, captchaToken);

            // Guardar preferencia de usuario
            if (rememberUser) {
                localStorage.setItem('aurontek_empresa_email', email);
            } else {
                localStorage.removeItem('aurontek_empresa_email');
            }

            login(data.token, data.usuario);

            // Redirigir al dashboard de empresa
            navigate('/empresa/dashboard');

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.msg || 'Credenciales incorrectas');
            recaptchaRef.current?.reset();
        } finally {
            setIsLoading(false);
        }
    };

    if (!codigoAcceso) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-white/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                <CardHeader className="space-y-1 relative pb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => navigate('/acceso-empresa')}
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Button>
                    <div className="flex justify-center mb-4 pt-4">
                        <div className="h-24 w-24 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-800">
                            <UserCircle className="h-12 w-12 text-brand-600 dark:text-brand-500" />
                        </div>
                    </div>
                    <CardTitle className="text-center font-bold text-2xl text-slate-900 dark:text-slate-50">Iniciar Sesión</CardTitle>
                    <CardDescription className="text-center text-slate-600 dark:text-slate-400">
                        {empresaNombre ? (
                            <>
                                Accediendo a <span className="font-semibold text-brand-700 dark:text-brand-300">{empresaNombre}</span>
                            </>
                        ) : (
                            <>Accediendo a organización</>
                        )}
                        <br />
                        {/* Hidden/Masked Code Visual Representation */}
                        <div className="flex items-center justify-center gap-1 mt-3">
                            <div className="flex gap-1">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-brand-200 dark:bg-slate-700" />
                                ))}
                            </div>
                            <span className="text-xs text-slate-400 ml-2 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Código Seguro</span>
                        </div>
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg animate-in shake text-center">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-11 border-slate-200 dark:border-slate-800 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950/50"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11 border-slate-200 dark:border-slate-800 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950/50"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember_user"
                                        checked={rememberUser}
                                        onCheckedChange={(checked) => setRememberUser(checked as boolean)}
                                    />
                                    <label
                                        htmlFor="remember_user"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                                    >
                                        Recordar usuario
                                    </label>
                                </div>
                                <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <div className="flex justify-center pt-2">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                size="normal"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button
                            className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md transition-all hover:-translate-y-0.5"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Autenticando...</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" /> Entrar al Portal
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginEmpresa;
