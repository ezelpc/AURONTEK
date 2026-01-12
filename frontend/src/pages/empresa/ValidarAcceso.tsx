import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/auth/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

import { Checkbox } from '@/components/ui/checkbox';

const ValidarAcceso = () => {
    const navigate = useNavigate();
    const [codigo, setCodigo] = useState('');
    const [rememberCode, setRememberCode] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Verificar código guardado al cargar
    React.useEffect(() => {
        const checkSavedCode = async () => {
            const savedData = localStorage.getItem('aurontek_empresa_code');
            if (savedData) {
                try {
                    const { code, expiresAt } = JSON.parse(savedData);
                    if (Date.now() < expiresAt) {
                        // Código válido y no expirado, validar automáticamente visualizando loader
                        setIsLoading(true);
                        const data = await authService.validarCodigoEmpresa(code);
                        navigate('/empresa/login', {
                            state: {
                                codigo: code,
                                empresaNombre: data.empresa.nombre,
                                empresaId: data.empresa.id
                            }
                        });
                        return; // Detener ejecución para esperar navegación
                    } else {
                        localStorage.removeItem('aurontek_empresa_code');
                    }
                } catch (e) {
                    localStorage.removeItem('aurontek_empresa_code');
                }
            }
            setIsCheckingAuth(false);
        };
        checkSavedCode();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (codigo.length !== 8) {
            setError('El código debe tener 8 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            // Validar código con backend y obtener nombre de empresa
            const data = await authService.validarCodigoEmpresa(codigo);

            // Guardar si el usuario lo solicitó
            if (rememberCode) {
                const expiresAt = Date.now() + (20 * 24 * 60 * 60 * 1000); // 20 días
                localStorage.setItem('aurontek_empresa_code', JSON.stringify({ code: codigo, expiresAt }));
            }

            // Navegar al login
            navigate('/empresa/login', {
                state: {
                    codigo: codigo,
                    empresaNombre: data.empresa.nombre,
                    empresaId: data.empresa.id
                }
            });

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.msg || 'Código de empresa inválido o inactivo.');
            setIsLoading(false);
        }
    };

    // Si está comprobando auto-login, mostrar un estado de carga minimalista o nada para evitar parpadeos
    if (isCheckingAuth) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-white/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-20 w-20 bg-brand-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-brand-100 dark:ring-slate-700">
                            <Building2 className="h-10 w-10 text-brand-600 dark:text-brand-500" />
                        </div>
                    </div>
                    <CardTitle className="text-center font-bold text-2xl tracking-tight text-slate-900 dark:text-slate-50">
                        Portal de Empresa
                    </CardTitle>
                    <CardDescription className="text-center text-slate-500 dark:text-slate-400 text-base">
                        Ingrese el código único de su organización para acceder al espacio de trabajo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 flex flex-col items-center">
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg animate-in slide-in-from-top-2 w-full">
                                <ShieldCheck className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-4 flex flex-col items-center w-full">
                            <Label htmlFor="codigo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Código de Acceso
                            </Label>

                            <InputOTP
                                maxLength={8}
                                value={codigo}
                                pattern="^[a-zA-Z0-9]*$"
                                inputMode="text"
                                onChange={(value) => setCodigo(value)}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} className="h-12 w-10" />
                                    <InputOTPSlot index={1} className="h-12 w-10" />
                                    <InputOTPSlot index={2} className="h-12 w-10" />
                                    <InputOTPSlot index={3} className="h-12 w-10" />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={4} className="h-12 w-10" />
                                    <InputOTPSlot index={5} className="h-12 w-10" />
                                    <InputOTPSlot index={6} className="h-12 w-10" />
                                    <InputOTPSlot index={7} className="h-12 w-10" />
                                </InputOTPGroup>
                            </InputOTP>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberCode}
                                    onCheckedChange={(checked) => setRememberCode(checked as boolean)}
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                                >
                                    Recordar este dispositivo por 20 días
                                </label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8">
                        <Button
                            className="w-full h-12 text-base font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Verificando...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Continuar <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-6 text-center text-xs text-slate-400 dark:text-slate-600 font-medium">
                © 2025 Aurontek. Portal de Acceso.
            </div>
        </div>
    );
};

export default ValidarAcceso;
