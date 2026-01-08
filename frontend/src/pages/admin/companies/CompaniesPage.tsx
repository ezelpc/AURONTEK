import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/api/companies.service';
import { Empresa } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Ban, CheckCircle, Key, Trash2 } from 'lucide-react';
import CompanyForm from './CompanyForm';
import { useTranslation } from 'react-i18next';

import { PERMISSIONS } from '@/constants/permissions';
import { toast } from 'sonner';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CompaniesPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [isCreating, setIsCreating] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Empresa | null>(null);
    const [toggleAction, setToggleAction] = useState<{ id: string, estado: boolean, nombre: string } | null>(null);
    const [regenerateAction, setRegenerateAction] = useState<{ id: string, nombre: string } | null>(null);
    const [deletingCompany, setDeletingCompany] = useState<{ id: string, nombre: string } | null>(null);
    const [passwordDialog, setPasswordDialog] = useState<{ action: 'edit' | 'toggle' | 'regenerate' | 'delete' | 'reveal-code', company: Empresa } | null>(null);

    const [password, setPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

    const AURONTEK_PASSWORD = import.meta.env.VITE_AURONTEK_ADMIN_PASSWORD || 'aurontek2024';

    const isAurontek = (empresa: Empresa) => {
        return empresa.nombre.toLowerCase().includes('aurontek');
    };

    const verifyPassword = () => {
        if (password === AURONTEK_PASSWORD) {
            if (passwordDialog) {
                executeAction(passwordDialog.action, passwordDialog.company);
            }
            setPasswordDialog(null);
            setPassword('');
        } else {
            toast.error(t('companies.dialogs.error_password') || 'Contraseña incorrecta');
        }
    };

    // Fetch Companies
    const { data: companies, isLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: companiesService.getCompanies
    });

    // Toggle License Mutation
    const toggleLicenseMutation = useMutation({
        mutationFn: ({ id, estado }: { id: string, estado: boolean }) =>
            companiesService.toggleLicense(id, estado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('companies.notifications.license_updated') || 'Estado de licencia actualizado');
            setToggleAction(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
            setToggleAction(null);
        }
    });

    // Regenerate Code Mutation
    const regenerateCodeMutation = useMutation({
        mutationFn: companiesService.regenerateCode,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(`${t('companies.notifications.new_code') || 'Nuevo código generado'}: ${data.codigo_acceso}`);
            setRegenerateAction(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
            setRegenerateAction(null);
        }
    });

    // Delete Company Mutation
    const deleteCompanyMutation = useMutation({
        mutationFn: companiesService.deleteCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(t('companies.notifications.deleted') || 'Empresa eliminada correctamente');
            setDeletingCompany(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
            setDeletingCompany(null);
        }
    });

    const handleProtectedAction = (action: 'edit' | 'toggle' | 'regenerate' | 'delete' | 'reveal-code', empresa: Empresa) => {
        if (isAurontek(empresa)) {
            setPasswordDialog({ action, company: empresa });
        } else {
            executeAction(action, empresa);
        }
    };

    const executeAction = (action: 'edit' | 'toggle' | 'regenerate' | 'delete' | 'reveal-code', empresa: Empresa) => {
        const companyId = empresa._id || empresa.id!;
        switch (action) {
            case 'edit':
                setEditingCompany(empresa);
                setIsCreating(false);
                break;
            case 'toggle':
                setToggleAction({
                    id: companyId,
                    estado: !empresa.activo,
                    nombre: empresa.nombre
                });
                break;
            case 'regenerate':
                setRegenerateAction({
                    id: companyId,
                    nombre: empresa.nombre
                });
                break;
            case 'delete':
                setDeletingCompany({
                    id: companyId,
                    nombre: empresa.nombre
                });
                break;
            case 'reveal-code':
                setVisibleCodes(prev => {
                    const next = new Set(prev);
                    if (next.has(companyId)) next.delete(companyId);
                    else next.add(companyId);
                    return next;
                });
                break;
        }
    };

    const toggleCodeVisibility = (empresa: Empresa) => {
        const companyId = empresa._id || empresa.id!;

        // If already visible, just hide it (no protection needed to hide)
        if (visibleCodes.has(companyId)) {
            setVisibleCodes(prev => {
                const next = new Set(prev);
                next.delete(companyId);
                return next;
            });
            return;
        }

        // If trying to show
        if (isAurontek(empresa)) {
            handleProtectedAction('reveal-code', empresa);
        } else {
            setVisibleCodes(prev => {
                const next = new Set(prev);
                next.add(companyId);
                return next;
            });
        }
    };

    const filteredCompanies = companies?.filter(company => {
        const matchesSearch =
            company.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.rfc.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === 'all') return matchesSearch;
        if (statusFilter === 'active') return matchesSearch && company.activo;
        if (statusFilter === 'suspended') return matchesSearch && !company.activo;

        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... Dialogs (Toggle, Regenerate, Delete, Password) ... */}
            <AlertDialog open={!!toggleAction} onOpenChange={(open) => !open && setToggleAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('companies.dialogs.toggle_license_title', { status: toggleAction?.estado ? 'Activar' : 'Suspender' })}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('companies.dialogs.toggle_license_desc', { status: toggleAction?.estado ? 'activar' : 'suspender', name: toggleAction?.nombre })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className={toggleAction?.estado ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                            onClick={() => toggleAction && toggleLicenseMutation.mutate({
                                id: toggleAction.id,
                                estado: toggleAction.estado
                            })}
                        >
                            {toggleAction?.estado ? t('common.active') : 'Suspender'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!regenerateAction} onOpenChange={(open) => !open && setRegenerateAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('companies.dialogs.regenerate_code_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('companies.dialogs.regenerate_code_desc', { name: regenerateAction?.nombre })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => regenerateAction && regenerateCodeMutation.mutate(regenerateAction.id)}
                        >
                            {t('common.yes')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-slate-100">{t('companies.dialogs.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-300">
                            {t('companies.dialogs.delete_desc', { name: deletingCompany?.nombre })}
                            <br /><br />
                            <span className="text-red-600 dark:text-red-400 font-semibold">⚠️ {t('common.irreversible_action')}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                            onClick={() => deletingCompany && deleteCompanyMutation.mutate(deletingCompany.id)}
                        >
                            {t('common.delete_permanently')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!passwordDialog} onOpenChange={(open) => {
                if (!open) {
                    setPasswordDialog(null);
                    setPassword('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('companies.dialogs.protected_action_title')}</DialogTitle>
                        <DialogDescription>
                            {t('companies.dialogs.protected_action_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="aurontek-password">{t('auth.password')}</Label>
                            <Input
                                id="aurontek-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                                placeholder="Ingresa la contraseña"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setPasswordDialog(null);
                            setPassword('');
                        }}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={verifyPassword}>
                            {t('auth.verify')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{t('companies.title')}</h2>
                        <p className="text-slate-500">{t('companies.subtitle')}</p>
                    </div>
                    {!isCreating && !editingCompany && (
                        <ProtectedButton
                            permission={PERMISSIONS.COMPANIES_CREATE}
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> {t('companies.new_company')}
                        </ProtectedButton>
                    )}
                </div>

                {/* Filters */}
                {!isCreating && !editingCompany && (
                    <div className="flex gap-4 items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="search">{t('common.search')}</Label>
                            <Input
                                id="search"
                                placeholder={t('common.search') + "..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>
                        <div className="grid w-full max-w-[200px] items-center gap-1.5">
                            <Label>{t('companies.table.status')}</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-800 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">{t('common.all')}</option>
                                <option value="active">{t('common.active')}</option>
                                <option value="suspended">{t('common.suspended')}</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {(isCreating || editingCompany) && (
                <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingCompany ? t('companies.edit_company') : t('companies.new_company')}</CardTitle>
                        <CardDescription>
                            {editingCompany ? t('companies.subtitle') : t('companies.subtitle')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <CompanyForm
                            company={editingCompany || undefined}
                            onSuccess={() => {
                                setIsCreating(false);
                                setEditingCompany(null);
                            }}
                            onCancel={() => {
                                setIsCreating(false);
                                setEditingCompany(null);
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t('companies.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('companies.table.name')}</TableHead>
                                    <TableHead>{t('companies.table.rfc')}</TableHead>
                                    <TableHead>{t('companies.table.contact')}</TableHead>
                                    <TableHead>{t('companies.table.access_code')}</TableHead>
                                    <TableHead>{t('companies.table.plan')}</TableHead>
                                    <TableHead>{t('companies.table.status')}</TableHead>
                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies?.map((empresa) => {
                                    const companyId = empresa._id || empresa.id!;
                                    return (
                                        <TableRow key={companyId}>
                                            <TableCell className="font-medium">{empresa.nombre}</TableCell>
                                            <TableCell>{empresa.rfc}</TableCell>
                                            <TableCell>{empresa.correo}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                                                    <span>
                                                        {visibleCodes.has(companyId)
                                                            ? (empresa.codigo_acceso || 'N/A')
                                                            : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleCodeVisibility(empresa)}
                                                        className="text-slate-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        {visibleCodes.has(companyId) ? <Key className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {empresa.licencia?.[0]?.plan || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={empresa.activo ? "default" : "destructive"}>
                                                    {empresa.activo ? t('common.active') : t('common.suspended')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <ProtectedButton
                                                    permission={PERMISSIONS.COMPANIES_UPDATE}
                                                    variant="ghost"
                                                    size="icon"
                                                    title={t('common.edit')}
                                                    onClick={() => handleProtectedAction('edit', empresa)}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                </ProtectedButton>

                                                <ProtectedButton
                                                    permission={PERMISSIONS.COMPANIES_SUSPEND}
                                                    variant="ghost"
                                                    size="icon"
                                                    title={empresa.activo ? "Suspender Licencia" : "Reactivar Licencia"}
                                                    onClick={() => handleProtectedAction('toggle', empresa)}
                                                >
                                                    {empresa.activo ? (
                                                        <Ban className="h-4 w-4 text-orange-500" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                </ProtectedButton>

                                                <ProtectedButton
                                                    permission={PERMISSIONS.COMPANIES_REGENERATE_CODE}
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Regenerar Código Acceso"
                                                    onClick={() => handleProtectedAction('regenerate', empresa)}
                                                >
                                                    <Key className="h-4 w-4 text-blue-500" />
                                                </ProtectedButton>

                                                <ProtectedButton
                                                    permission={PERMISSIONS.COMPANIES_DELETE}
                                                    variant="ghost"
                                                    size="icon"
                                                    title={t('common.delete')}
                                                    onClick={() => handleProtectedAction('delete', empresa)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </ProtectedButton>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {filteredCompanies?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                                            {t('common.no_data')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div >
    );
};

export default CompaniesPage;
