import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { rolesService, Role } from '@/api/roles.service';
import { useAuthStore } from '@/auth/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Pencil, Trash2, Ban, CheckCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { careGroupsService } from '@/api/care-groups.service';

// Simplified User Interface for Company Admin
interface LocalUserForm {
    nombre: string;
    email: string;
    rol: string;
    gruposDeAtencion?: string[];
}

const CompanyUsersPage = () => {
    const { user, hasPermission } = useAuthStore();
    const queryClient = useQueryClient();

    // State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deletingUser, setDeletingUser] = useState<any | null>(null);

    // Fetch Users ONLY for my company
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['company-users', user?.empresaId],
        queryFn: () => userService.getUsers(user?.empresaId),
        enabled: !!user?.empresaId
    });

    // Fetch Care Groups
    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['care-groups'],
        queryFn: careGroupsService.getAll
    });

    // Fetch Roles for my company
    const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
        queryKey: ['company-roles', user?.empresaId],
        queryFn: () => rolesService.getRoles({ empresaId: user?.empresaId }),
        enabled: !!user?.empresaId
    });

    const { register, handleSubmit, reset, setValue } = useForm<LocalUserForm>();

    const handleOpenDialog = (userToEdit?: any) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            setValue('nombre', userToEdit.nombre);
            setValue('email', userToEdit.email || userToEdit.correo);
            setValue('rol', userToEdit.rol);
        } else {
            setEditingUser(null);
            reset();
        }
        setIsDialogOpen(true);
    };

    const createMutation = useMutation({
        mutationFn: async (data: LocalUserForm) => {
            return userService.createUser({
                ...data,
                empresa: user?.empresaId, // Backend expects 'empresa'
                activo: true
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-users'] });
            toast.success('Usuario creado. Se ha enviado un correo con las credenciales.');
            setIsDialogOpen(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al crear usuario')
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<LocalUserForm> }) => {
            return userService.updateUser(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-users'] });
            toast.success('Usuario actualizado correctamente.');
            setIsDialogOpen(false);
            setEditingUser(null);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al actualizar usuario')
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, activo }: { id: string, activo: boolean }) => {
            return userService.updateUser(id, { activo });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-users'] });
            toast.success('Estado del usuario actualizado.');
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al cambiar estado')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return userService.deleteUser(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-users'] });
            toast.success('Usuario eliminado correctamente.');
            setDeletingUser(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al eliminar usuario')
    });

    const onSubmit = (data: LocalUserForm) => {
        if (editingUser) {
            updateMutation.mutate({ id: editingUser._id || editingUser.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) return <div>Cargando equipo...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Alert */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al usuario <b>{deletingUser?.nombre}</b> y revocará sus accesos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingUser && deleteMutation.mutate(deletingUser._id || deletingUser.id)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mi Equipo</h2>
                    <p className="text-slate-500">Gestiona el acceso de tus colaboradores.</p>
                </div>

                {hasPermission('users.create') && (
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                    </Button>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario Local'}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? 'Modifica los datos del usuario.' : 'Agrega un miembro a tu organización. La contraseña se generará automáticamente.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="nombre">Nombre Completo</Label>
                                <Input id="nombre" {...register('nombre', { required: true })} />
                            </div>

                            <div>
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" {...register('email', { required: true })} disabled={!!editingUser} />
                            </div>

                            <div>
                                <Label>Rol</Label>
                                <Select
                                    onValueChange={(val) => setValue('rol', val)}
                                    defaultValue={editingUser?.rol}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {!isLoadingRoles && roles.length > 0 ? (
                                            roles.map((rol) => (
                                                <SelectItem key={rol._id} value={rol.nombre}>
                                                    {rol.nombre}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-slate-500 text-center">
                                                No hay roles disponibles
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Grupos de Atención</Label>
                                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                                    {isLoadingGroups ? (
                                        <p className="text-sm text-slate-500">Cargando grupos...</p>
                                    ) : groups.length > 0 ? (
                                        groups.map((group) => (
                                            <div key={group._id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`group-${group._id}`}
                                                    className="rounded border-gray-300"
                                                    {...register('gruposDeAtencion')}
                                                    value={group._id}
                                                    defaultChecked={editingUser?.gruposDeAtencion?.some((g: any) => (g._id || g) === group._id)}
                                                />
                                                <Label htmlFor={`group-${group._id}`} className="font-normal cursor-pointer">
                                                    {group.nombre}
                                                </Label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No hay grupos de atención disponibles</p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
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
                                <TableRow key={u.id || u._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                                {(u.fotoPerfil || u.foto) ? (
                                                    <img src={u.fotoPerfil || u.foto} alt={u.nombre} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="font-bold text-sm">{(u.nombre || '?').charAt(0).toUpperCase()}</div>
                                                )}
                                            </div>
                                            <span>{u.nombre}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.email || u.correo}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{u.rol}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.activo ? 'default' : 'secondary'}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                                                {hasPermission('users.update') && (
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(u)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                )}

                                                {hasPermission('users.suspend') && (
                                                    <DropdownMenuItem onClick={() => statusMutation.mutate({ id: u._id || u.id, activo: !u.activo })}>
                                                        {u.activo ? (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                                                Suspender
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                Activar
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />

                                                {hasPermission('users.delete') && (
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingUser(u)}
                                                        className="text-red-600 focus:text-red-500 focus:bg-red-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
