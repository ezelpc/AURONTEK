import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminsService, SystemAdmin } from '@/api/admins.service';
import { rolesService } from '@/api/roles.service';
import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShieldCheck, ShieldAlert, Pencil, Key } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useForm } from 'react-hook-form';
import { PERMISSIONS } from '@/constants/permissions';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
            toast.success(t('common.success'));
            setDeletingAdminId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
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
            toast.success(t('common.success'));
            setIsOpen(false);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || t('common.error'))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<SystemAdmin> }) => adminsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-admins'] });
            toast.success(t('common.success'));
            setIsOpen(false);
            setEditingAdmin(null);
            reset();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || t('common.error'))
    });

    // Fetch Internal Roles
    const { data: roles } = useQuery({
        queryKey: ['roles', 'internal'],
        queryFn: () => rolesService.getRoles({ scope: 'internal' })
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
            // Find the selected role to get its permissions
            const selectedRole = roles?.find(r => r.slug === data.rol);
            const payload = {
                ...data,
                permisos: selectedRole?.permisos || []
            };
            createMutation.mutate(payload);
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

    if (isLoading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... Dialogs ... */}
            <AlertDialog open={!!deletingAdminId} onOpenChange={(open) => !open && setDeletingAdminId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.delete_permanently')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('common.confirm_delete')} {t('common.irreversible_action')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingAdminId && deleteMutation.mutate(deletingAdminId)}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('admins.title')}</h2>
                    <p className="text-slate-500">{t('admins.subtitle')}</p>
                </div>

                {/* New Admin Button Removed by User Request */}
                <Dialog open={isOpen} onOpenChange={(open) => {
                    if (open) setIsOpen(true);
                    else handleCloseDialog();
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAdmin ? t('admins.edit_admin') : t('admins.new_admin')}
                            </DialogTitle>
                            <DialogDescription>
                                {editingAdmin
                                    ? t('admins.subtitle')
                                    : t('admins.subtitle')}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="nombre">{t('admins.table.name')}</Label>
                                <Input id="nombre" {...register('nombre', { required: t('validation.required') })} />
                                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
                            </div>

                            <div>
                                <Label htmlFor="correo">{t('admins.table.email')}</Label>
                                <Input id="correo" type="email" {...register('correo', { required: t('validation.required') })} />
                                {errors.correo && <span className="text-red-500 text-xs">{errors.correo.message}</span>}
                            </div>

                            <div>
                                <Label>{t('admins.table.role')}</Label>
                                <Select
                                    value={rol}
                                    onValueChange={(val: any) => setValue('rol', val)}
                                    disabled={editingAdmin?.rol === 'admin-general'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('common.search')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles?.map(r => (
                                            <SelectItem key={r.slug} value={r.slug}>
                                                {r.nombre} {r.slug === 'admin-general' ? `(${t('admins.roles.super_admin')})` : ''}
                                            </SelectItem>
                                        ))}
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
                                    {t('auth.password')} {editingAdmin && `(${t('common.optional')})`}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: !editingAdmin ? t('validation.required') : false })}
                                />
                                {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending
                                        ? t('common.loading')
                                        : (editingAdmin ? t('common.save') : t('common.create'))}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-800">
                <CardHeader>
                    <CardTitle>{t('admins.subtitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('admins.table.name')}</TableHead>
                                <TableHead>{t('admins.table.email')}</TableHead>
                                <TableHead>{t('admins.table.role')}</TableHead>
                                <TableHead>{t('admins.table.permissions')}</TableHead>
                                <TableHead>{t('admins.table.status')}</TableHead>
                                <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                                            {admin.rol === 'admin-general' ? t('admins.roles.super_admin') : t('admins.roles.sub_root')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <Key className="h-3 w-3 text-slate-400" />
                                                        <span className="text-sm text-slate-600">
                                                            {admin.rol === 'admin-general' ? t('common.all') : `${admin.permisos?.length || 0}`}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px] flex flex-wrap gap-1 bg-slate-800 border-slate-700 text-slate-200">
                                                    {admin.rol === 'admin-general' ? (
                                                        <span className="text-xs">{t('admins.tooltips.total_access')}</span>
                                                    ) : (
                                                        admin.permisos?.map((p: string) => (
                                                            <Badge key={p} variant="outline" className="text-[10px] h-5 px-1 border-slate-600">
                                                                {p}
                                                            </Badge>
                                                        ))
                                                    )}
                                                    {(!admin.permisos || admin.permisos.length === 0) && admin.rol !== 'admin-general' && (
                                                        <span className="text-xs text-slate-400">{t('admins.tooltips.no_permissions')}</span>
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-green-500 text-green-500">{t('common.active')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ProtectedButton
                                            permission={PERMISSIONS.ADMINS_MANAGE}
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(admin)}
                                            disabled={admin.rol === 'admin-general'}
                                            title={admin.rol === 'admin-general' ? 'No se puede editar Super Admin' : t('common.edit')}
                                        >
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </ProtectedButton>
                                        <ProtectedButton
                                            permission={PERMISSIONS.ADMINS_MANAGE}
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(admin._id!)}
                                            disabled={admin.rol === 'admin-general'}
                                            title={admin.rol === 'admin-general' ? 'No se puede eliminar Super Admin' : t('common.delete')}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </ProtectedButton>
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
