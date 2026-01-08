import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService, Role } from '@/api/roles.service';
import { useAuthStore } from '@/auth/auth.store';

import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShieldCheck, Pencil, Trash2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PERMISSIONS } from '@/constants/permissions';
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
import { GROUPED_PERMISSIONS, COMPANY_GROUPED_PERMISSIONS } from '@/constants/permissions';
import { useTranslation } from 'react-i18next';

const RolesPage = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();

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
        queryFn: () => rolesService.getRoles({ scope: 'internal' })
    });

    const createMutation = useMutation({
        mutationFn: rolesService.createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success(t('common.success'));
            handleCloseDialog();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || t('common.error'))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => rolesService.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success(t('common.success'));
            handleCloseDialog();
        },
        onError: (err: any) => toast.error(err.response?.data?.msg || t('common.error'))
    });

    const deleteMutation = useMutation({
        mutationFn: rolesService.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success(t('common.success'));
            setDeletingRoleId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
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
        if (!formData.nombre) return toast.error(t('validation.required'));

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
                        <AlertDialogTitle>{t('common.delete_permanently')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('common.confirm_delete')} {t('common.irreversible_action')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingRoleId && deleteMutation.mutate(deletingRoleId)}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('roles.title')}</h2>
                    <p className="text-slate-500">{t('roles.subtitle')}</p>
                </div>
                <ProtectedButton
                    permission={[PERMISSIONS.ROLES_CREATE, PERMISSIONS.ROLES_MANAGE, 'roles.create', 'roles.edit']}
                    showTooltip={true}
                    onClick={() => handleOpenDialog()}
                >
                    <Plus className="mr-2 h-4 w-4" /> {t('roles.new_role')}
                </ProtectedButton>
            </div>

            <Card className="dark:bg-slate-900 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        {t('roles.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
                    ) : roles && roles.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-700">
                                    <TableHead className="dark:text-slate-300">{t('roles.table.name')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('roles.table.description')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('roles.table.scope')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('roles.table.level')}</TableHead>
                                    <TableHead className="text-right dark:text-slate-300">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role._id} className="dark:border-slate-700">
                                        <TableCell className="font-medium dark:text-slate-100">
                                            {role.nombre}
                                            {isSystemRole(role) && <Badge variant="secondary" className="ml-2 text-xs dark:bg-slate-700 dark:text-slate-300">{t('common.nav.system')}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-sm truncate">{role.descripcion}</TableCell>
                                        <TableCell className="dark:text-slate-300">
                                            {role.empresa ? (typeof role.empresa === 'object' ? role.empresa.nombre : 'Empresa') : <Badge className="dark:bg-blue-900 dark:text-blue-100">Global</Badge>}
                                        </TableCell>
                                        <TableCell className="dark:text-slate-300">{role.nivel}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <ProtectedButton
                                                    permission={[PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_EDIT, PERMISSIONS.ROLES_MANAGE, 'roles.edit']}
                                                    showTooltip={true}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(role)}
                                                    className="dark:hover:bg-slate-800"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                </ProtectedButton>
                                                {!isSystemRole(role) && (
                                                    <ProtectedButton
                                                        permission={[PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE, 'roles.delete']}
                                                        showTooltip={true}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:text-red-500 dark:hover:bg-slate-800"
                                                        onClick={() => setDeletingRoleId(role._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 dark:text-slate-400" />
                                                    </ProtectedButton>
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
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('common.no_data')}</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{t('roles.subtitle')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? t('roles.edit_role') : t('roles.new_role')}</DialogTitle>
                        <DialogDescription>
                            {t('roles.subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-1 pr-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">{t('roles.form.name')}</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder={t('roles.form.name')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">{t('roles.form.description')}</Label>
                                <Input
                                    id="desc"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder={t('roles.form.description')}
                                />
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold flex items-center">
                                    <ShieldCheck className="mr-2 h-4 w-4" /> {t('roles.form.permissions')}
                                </h4>
                                <div className="space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const permissionsToUse = ['admin-general', 'admin-subroot'].includes(user?.rol || '')
                                                ? GROUPED_PERMISSIONS
                                                : COMPANY_GROUPED_PERMISSIONS;
                                            const allPermissions = Object.values(permissionsToUse).flatMap(group => group.map(p => p.key));
                                            setFormData(prev => ({ ...prev, permisos: allPermissions }));
                                        }}
                                        className="h-7 text-xs"
                                    >
                                        {t('roles.form.select_all')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, permisos: [] }))}
                                        className="h-7 text-xs"
                                    >
                                        {t('roles.form.select_none')}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {(() => {
                                    const permissionsToUse = ['admin-general', 'admin-subroot'].includes(user?.rol || '')
                                        ? GROUPED_PERMISSIONS
                                        : COMPANY_GROUPED_PERMISSIONS;

                                    return Object.entries(permissionsToUse).map(([group, permissions]) => (
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
                                    ))
                                })()}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            <Save className="mr-2 h-4 w-4" /> {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RolesPage;
