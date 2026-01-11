import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authService } from '@/api/auth.service';
import { toast } from 'sonner';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>();
    // Support both /:token and ?token=... just in case
    const [searchParams] = useSearchParams();
    const tokenFromQuery = searchParams.get('token');

    const finalToken = token || tokenFromQuery;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!finalToken) {
            toast.error('Token de recuperación no válido');
            navigate('/empresa/login');
        }
    }, [finalToken, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(finalToken!, password);
            // toast.success('Contraseña actualizada exitosamente');
            setSuccess(true);
            setTimeout(() => navigate('/empresa/login'), 5000);
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Error al restablecer contraseña. El token puede haber expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
                <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300 border-green-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-green-700">¡Contraseña Actualizada!</CardTitle>
                        <CardDescription>
                            Tu contraseña ha sido modificada correctamente.
                            <br />
                            Serás redirigido al login en unos segundos.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => navigate('/empresa/login')} className="bg-green-600 hover:bg-green-700">
                            Ir al Login ahora
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
            <Card className="max-w-md w-full shadow-lg border-t-4 border-t-blue-600 animate-in fade-in zoom-in duration-300">
                <CardHeader className="space-y-1">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl text-center">Nueva Contraseña</CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tu nueva contraseña para acceder
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirmar Contraseña</Label>
                            <Input
                                id="confirm"
                                type="password"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
