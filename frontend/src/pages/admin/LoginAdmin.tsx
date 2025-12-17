import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';
import { authService } from '@/auth/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

const LoginAdmin = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Verificar ReCAPTCHA
        const captchaToken = recaptchaRef.current?.getValue();
        if (!captchaToken) {
            setError('Por favor completa la verificación de seguridad.');
            setIsLoading(false);
            return;
        }

        try {
            // Nota: El authService.loginAdmin ahora debería aceptar captcha o lo ignorará si no fue actualizado todavía.
            // Si el backend requiere captcha para admins, debo pasarlo.
            // Por ahora, asumimos que el usuario solo quiere el control en frontend como paso previo.
            const data = await authService.loginAdmin(email, password, captchaToken);

            // Verificar rol explícitamente por seguridad
            if (['admin-general', 'admin-subroot'].includes(data.usuario.rol)) {
                login(data.token, data.usuario);
                navigate('/admin/dashboard');
            } else {
                setError('Acceso denegado. No tienes permisos de administrador.');
                recaptchaRef.current?.reset();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.msg || 'Error de autenticación. Verifique sus credenciales.');
            recaptchaRef.current?.reset();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/5 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 relative z-10">
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-slate-700">
                            <ShieldCheck className="h-10 w-10 text-indigo-500 animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-center font-bold text-2xl tracking-tight text-white">
                        Aurontek HQ
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Panel de Administración Centralizado
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg text-center animate-in shake">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Correo Corporativo</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@aurontek.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-11 border-slate-800 bg-slate-950/50 focus:border-indigo-500 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-11 border-slate-800 bg-slate-950/50 focus:border-indigo-500 focus:ring-indigo-500/20 text-white transition-all"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-indigo-400 hover:bg-transparent transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="text-right">
                                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <div className="flex justify-center pt-2 scale-90 origin-center">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                theme="dark"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verificando credenciales...' : 'Acceder al Panel'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginAdmin;
