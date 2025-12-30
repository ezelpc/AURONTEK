import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { companiesService } from '@/api/companies.service';
import { rolesService } from '@/api/roles.service';
import UserForm from './UserForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { ProtectedButton } from '@/components/ProtectedButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Pencil, Trash2, Building2, Ban, CheckCircle, Key, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';

import { PERMISSIONS } from '@/constants/permissions';
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
import { useTranslation } from 'react-i18next';

const UsersPage = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();

    const tipo = searchParams.get('tipo'); // 'local' o 'global'

    const [showForm, setShowForm] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>(''); // '' = Todas
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // 1. Fetch Companies for Filter (Only if Super Admin)
    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: companiesService.getCompanies,
    });

    // 2. Fetch Users (Filtered by tipo)
    const { data: allUsers = [], isLoading } = useQuery({
        queryKey: ['users', selectedCompany],
        queryFn: () => userService.getUsers(selectedCompany || undefined),
    });

    // Find AurontekHQ company ID
    const aurontekHQ = companies?.find((c: any) => c.rfc === 'AURONTEK001');
    const aurontekHQId = aurontekHQ?._id || aurontekHQ?.id;

    // Filter users based on tipo parameter
    const users = allUsers.filter((user: any) => {
        // Filter by tipo
        if (tipo === 'local') {
            // Local: All users from AurontekHQ (internal staff)
            const userEmpresaId = user.empresaId || user.empresa?._id || user.empresa?.id || user.empresa;
            return String(userEmpresaId) === String(aurontekHQId);
        } else if (tipo === 'global') {
            // Global: users from client companies (not AurontekHQ)
            const userEmpresaId = user.empresaId || user.empresa?._id || user.empresa?.id || user.empresa;
            return String(userEmpresaId) !== String(aurontekHQId);
        }
        // If no tipo specified, show all
        return true;
    }).filter((user: any) => {
        // Filter by search term
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.nombre?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.correo?.toLowerCase().includes(search) ||
            user.rol?.toLowerCase().includes(search)
        );
    });

    // 3. Fetch Roles to map permissions (Global lookup)
    const { data: roles = [] } = useQuery({
        queryKey: ['roles-all', selectedCompany],
        queryFn: () => rolesService.getRoles(selectedCompany || undefined),
    });

    // Helper to get permissions for a user
    const getUserPermissions = (user: any) => {
        // If user has direct permissions, use them
        if (user.permisos && user.permisos.length > 0) return user.permisos;

        // heuristic: if 'admin-general', return special
        if (user.rol === 'admin-general') return ['*'];

        // Otherwise find permissions from role
        const userRole = Array.isArray(roles) ? roles.find((r: any) => r.nombre === user.rol && (r.empresa === user.empresa || r.empresa === user.empresaId)) : null;
        // Fallback: search by name only if company match fails (global roles?)
        const fallbackRole = !userRole && Array.isArray(roles) ? roles.find((r: any) => r.nombre === user.rol) : null;

        return userRole?.permisos || fallbackRole?.permisos || [];
    };

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('common.success'));
            setDeletingUserId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.msg || t('common.error'));
            setDeletingUserId(null);
        }
    });

    // Toggle Active Status Mutation
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, activo }: { id: string, activo: boolean }) =>
            userService.updateUser(id, { activo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('common.success'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.msg || t('common.error'));
        }
    });

    const getCompanyName = (empresaData?: string | { _id?: string, id?: string, nombre?: string }) => {
        if (!empresaData) return 'N/A';

        // If it's already a populated object with nombre, return it
        if (typeof empresaData === 'object' && empresaData.nombre) {
            return empresaData.nombre;
        }

        // If it's an ID (string), look it up in companies
        const id = typeof empresaData === 'string' ? empresaData : (empresaData._id || empresaData.id);
        return companies?.find(c => c._id === id || c.id === id)?.nombre || 'Desconocida';
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    // Title and Subtitle logic
    const getPageTitle = () => {
        if (tipo === 'local') return t('users.title_local');
        if (tipo === 'global') return t('users.title_global');
        return t('users.title');
    };

    const getPageSubtitle = () => {
        if (tipo === 'local') return t('users.subtitle_local');
        if (tipo === 'global') return t('users.subtitle_global');
        return t('users.subtitle');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
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
                            onClick={() => deletingUserId && deleteMutation.mutate(deletingUserId)}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {getPageTitle()}
                    </h2>
                    <p className="text-slate-500">
                        {getPageSubtitle()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder={t('users.search_placeholder')}
                            className="pl-9 w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Company Filter - Only show for global view */}
                    {tipo === 'global' && (
                        <div className="relative">
                            <select
                                className="h-10 w-[200px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="" className="dark:bg-slate-800 dark:text-slate-100">{t('users.filter_company')}</option>
                                {Array.isArray(companies) && companies
                                    .filter(c => c.rfc !== 'AURONTEK001') // Excluir AurontekHQ
                                    .map(c => (
                                        <option key={c._id || c.id} value={c._id || c.id} className="dark:bg-slate-800 dark:text-slate-100">
                                            {c.nombre}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <ProtectedButton
                        permission={tipo === 'local' ? [PERMISSIONS.USERS_CREATE, PERMISSIONS.ADMINS_MANAGE] : PERMISSIONS.USERS_CREATE}
                        onClick={() => { setEditingUser(null); setShowForm(!showForm); }}
                        variant={showForm ? "secondary" : "default"}
                    >
                        {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {showForm ? t('common.cancel') : t('users.new_user')}
                    </ProtectedButton>
                </div>
            </div>

            {showForm && (
                <Card className="border-blue-200 shadow-lg animate-in slide-in-from-top-4">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingUser ? t('users.edit_user') : t('users.new_user')}</CardTitle>
                        <CardDescription>
                            {editingUser ? t('users.form.desc_edit') : t('users.form.desc_create')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <UserForm
                            userToEdit={editingUser}
                            onSuccess={handleCloseForm}
                            tipo={tipo as 'local' | 'global' | null}
                        />
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        {getPageTitle()}
                        {selectedCompany && <Badge variant="secondary" className="ml-2 dark:bg-slate-700 dark:text-slate-300">{t('users.filtered')}</Badge>}
                        {searchTerm && <Badge variant="secondary" className="ml-2 dark:bg-slate-700 dark:text-slate-300">{t('users.active_search')}</Badge>}
                        <Badge variant="outline" className="ml-auto">{t('users.count', { count: users.length })}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-700">
                                    <TableHead className="dark:text-slate-300">{t('users.table.user')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('users.table.company')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('users.table.role_position')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('users.table.permissions')}</TableHead>
                                    <TableHead className="dark:text-slate-300">{t('users.table.status')}</TableHead>
                                    <TableHead className="text-right dark:text-slate-300">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.isArray(users) && users.map((user: any) => (
                                    <TableRow key={user.id || user._id} className="dark:border-slate-700">
                                        <TableCell>
                                            <div className="font-medium dark:text-slate-100">{user.nombre}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email || user.correo}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                <span className="text-sm dark:text-slate-300">{getCompanyName(user.empresaId || user.empresa)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="mb-1 bg-blue-50 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800">
                                                {typeof user.rol === 'object' && user.rol !== null ? user.rol.nombre : user.rol}
                                            </Badge>
                                            {user.puesto && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.puesto}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1 cursor-help">
                                                            <Key className="h-3 w-3 text-slate-400" />
                                                            <span className="text-sm dark:text-slate-300">
                                                                {(typeof user.rol === 'string' && user.rol === 'admin-general') || (typeof user.rol === 'object' && user.rol?.slug === 'admin-general') ? 'Total' : getUserPermissions(user).length}
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[300px] flex flex-wrap gap-1 bg-slate-800 border-slate-700 text-slate-200">
                                                        {getUserPermissions(user).length > 0 ? getUserPermissions(user).map((p: string) => (
                                                            <Badge key={p} variant="outline" className="text-[10px] h-5 px-1 border-slate-600">
                                                                {p}
                                                            </Badge>
                                                        )) : (
                                                            <span className="text-xs text-slate-400">{t('admins.tooltips.no_permissions')}</span>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.activo ? "default" : "secondary"} className={user.activo ? "dark:bg-green-900 dark:text-green-100" : "dark:bg-slate-700 dark:text-slate-300"}>
                                                {user.activo ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ProtectedButton
                                                permission={PERMISSIONS.USERS_UPDATE}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(user)}
                                                className="dark:hover:bg-slate-800"
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                            </ProtectedButton>
                                            <ProtectedButton
                                                permission={PERMISSIONS.USERS_SUSPEND}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleActiveMutation.mutate({
                                                    id: user.id || user._id,
                                                    activo: !user.activo
                                                })}
                                                className="dark:hover:bg-slate-800"
                                            >
                                                {user.activo ? (
                                                    <Ban className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                )}
                                            </ProtectedButton>
                                            <ProtectedButton
                                                permission={PERMISSIONS.USERS_DELETE}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingUserId(user.id || user._id)}
                                                className="dark:hover:bg-slate-800"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                            </ProtectedButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {Array.isArray(users) && users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                            {t('users.table.no_data')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersPage;
