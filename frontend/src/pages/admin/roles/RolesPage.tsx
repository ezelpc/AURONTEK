import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService, Role } from '@/api/roles.service';
import { useAuthStore } from '@/auth/auth.store';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShieldCheck, Pencil, Trash2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,

    DialogFooter
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { GROUPED_PERMISSIONS } from '@/constants/permissions';


const RolesPage = () => {
    const { user } = useAuthStore();

    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        permisos: [] as string[]
    });

    const { data: roles, isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesService.getRoles()
    });

    const createMutation = useMutation({
        mutationFn: rolesService.createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol creado correctamente');
            handleCloseDialog();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al crear rol')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => rolesService.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol actualizado correctamente');
            handleCloseDialog();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || 'Error al actualizar rol')
    });

    const deleteMutation = useMutation({
        mutationFn: rolesService.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol eliminado');
            setDeletingRoleId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al eliminar rol');
            setDeletingRoleId(null);
        }
    });

    const handleOpenDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                nombre: role.nombre,
                descripcion: role.descripcion,
                permisos: role.permisos
            });
        } else {
            setEditingRole(null);
            setFormData({
                nombre: '',
                descripcion: '',
                permisos: []
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingRole(null);
    };

    const handlePermissionToggle = (key: string) => {
        setFormData(prev => {
            const exists = prev.permisos.includes(key);
            if (exists) {
                return { ...prev, permisos: prev.permisos.filter(p => p !== key) };
            } else {
                return { ...prev, permisos: [...prev.permisos, key] };
            }
        });
    };

    const handleSave = () => {
        if (!formData.nombre) return toast.error('El nombre es requerido');

        if (editingRole) {
            updateMutation.mutate({ id: editingRole._id, data: formData });
        } else {
            createMutation.mutate({ ...formData, empresaId: user?.empresaId });
        }
    };



    const isSystemRole = (role: Role) => ['admin-general', 'admin-subroot'].includes(role.slug);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingRoleId} onOpenChange={(open) => !open && setDeletingRoleId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente este rol. Los usuarios con este rol perderán sus permisos asociados. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingRoleId && deleteMutation.mutate(deletingRoleId)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Roles</h2>
                    <p className="text-slate-500">Administra los perfiles de acceso y permisos del sistema.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                </Button>
            </div>

            <Card className="dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        Roles Configurados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">Cargando roles...</div>
                    ) : roles && roles.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-700">
                                    <TableHead className="dark:text-slate-300">Nombre</TableHead>
                                    <TableHead className="dark:text-slate-300">Descripción</TableHead>
                                    <TableHead className="dark:text-slate-300">Alcance</TableHead>
                                    <TableHead className="dark:text-slate-300">Nivel</TableHead>
                                    <TableHead className="text-right dark:text-slate-300">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role._id} className="dark:border-slate-700">
                                        <TableCell className="font-medium dark:text-slate-100">
                                            {role.nombre}
                                            {isSystemRole(role) && <Badge variant="secondary" className="ml-2 text-xs dark:bg-slate-700 dark:text-slate-300">Sistema</Badge>}
                                        </TableCell>
                                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-sm truncate">{role.descripcion}</TableCell>
                                        <TableCell className="dark:text-slate-300">
                                            {role.empresa ? (typeof role.empresa === 'object' ? role.empresa.nombre : 'Empresa') : <Badge className="dark:bg-blue-900 dark:text-blue-100">Global</Badge>}
                                        </TableCell>
                                        <TableCell className="dark:text-slate-300">{role.nivel}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(role)}
                                                    className="dark:hover:bg-slate-800"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                                {!isSystemRole(role) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:text-red-500 dark:hover:bg-slate-800"
                                                        onClick={() => setDeletingRoleId(role._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 dark:text-slate-400" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center">
                            <ShieldCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No hay roles configurados</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Crea el primer rol para comenzar</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
                        <DialogDescription>
                            Configura los detalles y permisos del rol.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-1 pr-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre del Rol</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej. Editor de Contenido"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Descripción</Label>
                                <Input
                                    id="desc"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Permite editar..."
                                />
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <h4 className="font-semibold mb-3 flex items-center">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Permisos
                            </h4>
                            <div className="space-y-6">
                                {Object.entries(GROUPED_PERMISSIONS).map(([group, permissions]) => (
                                    <div key={group}>
                                        <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 border-b pb-1">
                                            {group}
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {permissions.map((perm) => (
                                                <div key={perm.key} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={perm.key}
                                                        checked={formData.permisos.includes(perm.key)}
                                                        onCheckedChange={() => handlePermissionToggle(perm.key)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={perm.key}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {perm.label}
                                                        </label>
                                                        <p className="text-xs text-slate-500">
                                                            {perm.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            <Save className="mr-2 h-4 w-4" /> Guardar Rol
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RolesPage;
