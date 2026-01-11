import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { authService } from '@/api/auth.service';
import { toast } from 'sonner';
import { Shield, Mail, Lock } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [codigoAcceso, setCodigoAcceso] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !codigoAcceso) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setLoading(true);

        try {
            await authService.forgotPassword({
                email,
                codigoAcceso
            });

            setSubmitted(true);
        } catch (error: any) {
            // Incluso si falla, mostramos éxito por seguridad (si el backend devuelve msg genérico)
            // Pero si es error de conexión, mostramos error
            if (error.response?.data?.msg) {
                // Si el backend responde con mensaje (aunque sea genérico), lo mostramos o mostramos pantalla éxito
                // Nuestro backend siempre responde 200 JSON salvo error 500.
                // Si es 404 (empresa no existe), backend retorna json success.
                setSubmitted(true);
            } else {
                toast.error('Error de conexión o del servidor');
            }
        } finally {
            setLoading(false);
        }
    };

    // Prevenir copiar/pegar en código de acceso
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        toast.error('No puedes pegar el código. Debes escribirlo manualmente.');
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
                <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
                        <CardDescription>
                            Si el correo y código son correctos, recibirás instrucciones para restablecer tu contraseña.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center flex-col gap-4">
                        <p className="text-xs text-center text-muted-foreground">
                            Revisa tu carpeta de spam si no lo ves en unos minutos.
                        </p>
                        <Link to="/empresa/login" className="text-sm text-blue-600 hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 transition-colors">
            <Card className="max-w-md w-full shadow-lg border-t-4 border-t-blue-600 animate-in fade-in zoom-in duration-300">
                <CardHeader className="space-y-1">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl text-center">¿Olvidaste tu contraseña?</CardTitle>
                    <CardDescription className="text-center">
                        Verificación de Seguridad Requerida
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Código de Acceso */}
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código de Acceso de Empresa</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="codigo"
                                    type="text"
                                    placeholder="ABC123XYZ"
                                    value={codigoAcceso}
                                    onChange={(e) => setCodigoAcceso(e.target.value.toUpperCase())}
                                    onPaste={handlePaste}
                                    onCopy={(e) => e.preventDefault()}
                                    className="pl-9 uppercase font-mono tracking-widest"
                                    required
                                    autoComplete="off"
                                    maxLength={15}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500">
                                Escribe manualmente el código proporcionado por tu administrador.
                            </p>
                        </div>

                        {/* Alerta de Seguridad */}
                        <Alert variant="default" className="bg-blue-50/50 border-blue-200">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-xs text-blue-700 ml-2">
                                Por seguridad, no se permite copiar y pegar el código de acceso.
                            </AlertDescription>
                        </Alert>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Enviar Instrucciones'}
                        </Button>

                        <div className="text-center space-y-2">
                            <Link
                                to="/empresa/login"
                                className="text-sm text-blue-600 hover:underline block"
                            >
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
