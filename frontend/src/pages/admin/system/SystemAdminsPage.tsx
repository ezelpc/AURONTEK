import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminsService, SystemAdmin } from '@/api/admins.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShieldCheck, ShieldAlert, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from 'sonner';

const SystemAdminsPage = () => {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<SystemAdmin | null>(null);
    const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

    // Fetch
    const { data: admins, isLoading } = useQuery({
        queryKey: ['system-admins'],
        queryFn: adminsService.getAll
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: adminsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-admins'] });
            toast.success('Administrador eliminado');
            setDeletingAdminId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al eliminar administrador');
            setDeletingAdminId(null);
        }
    });

    // Form Logic
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SystemAdmin>();
    const rol = watch('rol');

    const createMutation = useMutation({
        mutationFn: adminsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-admins'] });
            toast.success('Administrador creado exitosamente');
            setIsOpen(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al crear administrador')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<SystemAdmin> }) => adminsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-admins'] });
            toast.success('Administrador actualizado exitosamente');
            setIsOpen(false);
            setEditingAdmin(null);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al actualizar administrador')
    });

    const onSubmit = (data: SystemAdmin) => {
        if (editingAdmin) {
            // Update mode - don't send password if empty
            const updateData: Partial<SystemAdmin> = {
                nombre: data.nombre,
                correo: data.correo,
                rol: data.rol
            };
            if (data.password) {
                updateData.password = data.password;
            }
            updateMutation.mutate({ id: editingAdmin._id!, data: updateData });
        } else {
            // Create mode
            createMutation.mutate(data);
        }
    };

    const handleEdit = (admin: SystemAdmin) => {
        setEditingAdmin(admin);
        setValue('nombre', admin.nombre);
        setValue('correo', admin.correo);
        setValue('rol', admin.rol);
        setValue('password', ''); // Clear password field
        setIsOpen(true);
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setEditingAdmin(null);
        reset();
    };

    const handleDelete = (adminId: string) => {
        setDeletingAdminId(adminId);
    };

    if (isLoading) return <div>Cargando administradores...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingAdminId} onOpenChange={(open) => !open && setDeletingAdminId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar administrador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al administrador del sistema. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingAdminId && deleteMutation.mutate(deletingAdminId)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Administradores del Sistema</h2>
                    <p className="text-slate-500">Gestiona al equipo interno de Aurontek (HQ).</p>
                </div>

                <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador del Sistema'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingAdmin
                                    ? 'Modifica los datos del administrador.'
                                    : 'Crea una cuenta para el equipo interno.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="nombre">Nombre Completo</Label>
                                <Input id="nombre" {...register('nombre', { required: 'Requerido' })} />
                                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
                            </div>

                            <div>
                                <Label htmlFor="correo">Correo Electrónico (Login)</Label>
                                <Input id="correo" type="email" {...register('correo', { required: 'Requerido' })} />
                                {errors.correo && <span className="text-red-500 text-xs">{errors.correo.message}</span>}
                            </div>

                            <div>
                                <Label>Rol</Label>
                                <Select
                                    value={rol}
                                    onValueChange={(val: any) => setValue('rol', val)}
                                    disabled={editingAdmin?.rol === 'admin-general'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin-general">Admin General (Super Admin)</SelectItem>
                                        <SelectItem value="admin-subroot">Admin Sub-Root (Gestión)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editingAdmin?.rol === 'admin-general' && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        No se puede cambiar el rol de Super Admin
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="password">
                                    Contraseña {editingAdmin && '(dejar vacío para no cambiar)'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: !editingAdmin ? 'Requerido' : false })}
                                />
                                {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending
                                        ? (editingAdmin ? 'Actualizando...' : 'Creando...')
                                        : (editingAdmin ? 'Actualizar Admin' : 'Crear Admin')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-800">
                <CardHeader>
                    <CardTitle>Equipo Aurontek HQ</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins?.map((admin) => (
                                <TableRow key={admin._id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {admin.rol === 'admin-general' ? (
                                            <ShieldAlert className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        )}
                                        {admin.nombre}
                                    </TableCell>
                                    <TableCell>{admin.correo}</TableCell>
                                    <TableCell>
                                        <Badge variant={admin.rol === 'admin-general' ? 'destructive' : 'default'}>
                                            {admin.rol === 'admin-general' ? 'Super Admin' : 'Sub-Root'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-green-500 text-green-500">Activo</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(admin)}
                                            disabled={admin.rol === 'admin-general'}
                                            title={admin.rol === 'admin-general' ? 'No se puede editar Super Admin' : 'Editar'}
                                        >
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(admin._id!)}
                                            disabled={admin.rol === 'admin-general'}
                                            title={admin.rol === 'admin-general' ? 'No se puede eliminar Super Admin' : 'Eliminar'}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemAdminsPage;
