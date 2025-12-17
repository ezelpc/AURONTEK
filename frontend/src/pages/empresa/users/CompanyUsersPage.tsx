import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { useAuthStore } from '@/auth/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

// Simplified User Interface for Company Admin
interface LocalUserForm {
    nombre: string;
    email: string;
    rol: string;
    password?: string;
}

const CompanyUsersPage = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // Fetch Users ONLY for my company
    // Backend userService.getUsers(companyId) -> checks permission. 
    // If I pass my companyId, backend should allow returning my users if I have 'users.view'
    // Assuming userService.getUsers handles filtering if companyId is passed.
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['company-users', user?.empresaId],
        queryFn: () => userService.getUsers(user?.empresaId),
        enabled: !!user?.empresaId
    });

    const { register, handleSubmit, reset, setValue } = useForm<LocalUserForm>();

    const createMutation = useMutation({
        mutationFn: async (data: LocalUserForm) => {
            // Force companyId to my company
            return userService.createUser({
                ...data,
                empresaId: user?.empresaId,
                // Force roles allowed for local management
                rol: data.rol // 'admin-interno' or 'usuario' or 'soporte'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-users'] });
            toast.success('Usuario creado');
            setIsOpen(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al crear usuario')
    });

    const onSubmit = (data: LocalUserForm) => {
        createMutation.mutate(data);
    };

    if (isLoading) return <div>Cargando equipo...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mi Equipo</h2>
                    <p className="text-slate-500">Gestiona el acceso de tus colaboradores.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuevo Usuario Local</DialogTitle>
                            <DialogDescription>
                                Agrega un miembro a tu organización.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="nombre">Nombre Completo</Label>
                                <Input id="nombre" {...register('nombre', { required: true })} />
                            </div>

                            <div>
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" {...register('email', { required: true })} />
                            </div>

                            <div>
                                <Label>Rol</Label>
                                <Select onValueChange={(val) => setValue('rol', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usuario">Usuario Estándar</SelectItem>
                                        <SelectItem value="admin-interno">Administrador (Local)</SelectItem>
                                        <SelectItem value="soporte">Soporte Técnico (Local)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="password">Contraseña Temporal</Label>
                                <Input id="password" type="password" {...register('password', { required: true })} />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Directorio de {user?.empresa}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.isArray(users) && users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                        {u.nombre}
                                    </TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{u.rol}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.activo ? 'default' : 'secondary'}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {Array.isArray(users) && users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                        No hay usuarios registrados en tu equipo.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default CompanyUsersPage;
