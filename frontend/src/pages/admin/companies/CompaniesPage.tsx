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
import { useAuthStore } from '@/auth/auth.store';
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
    const queryClient = useQueryClient();

    const [isCreating, setIsCreating] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Empresa | null>(null);
    const [toggleAction, setToggleAction] = useState<{ id: string, estado: boolean, nombre: string } | null>(null);
    const [regenerateAction, setRegenerateAction] = useState<{ id: string, nombre: string } | null>(null);
    const [deletingCompany, setDeletingCompany] = useState<{ id: string, nombre: string } | null>(null);
    const [passwordDialog, setPasswordDialog] = useState<{ action: 'edit' | 'toggle' | 'regenerate' | 'delete', company: Empresa } | null>(null);
    const [password, setPassword] = useState('');

    const AURONTEK_PASSWORD = import.meta.env.VITE_AURONTEK_ADMIN_PASSWORD || 'aurontek2024';

    const isAurontek = (empresa: Empresa) => {
        return empresa.nombre.toLowerCase().includes('aurontek');
    };

    const handleProtectedAction = (action: 'edit' | 'toggle' | 'regenerate' | 'delete', empresa: Empresa) => {
        if (isAurontek(empresa)) {
            setPasswordDialog({ action, company: empresa });
        } else {
            executeAction(action, empresa);
        }
    };

    const executeAction = (action: 'edit' | 'toggle' | 'regenerate' | 'delete', empresa: Empresa) => {
        switch (action) {
            case 'edit':
                setEditingCompany(empresa);
                setIsCreating(false);
                break;
            case 'toggle':
                setToggleAction({
                    id: empresa._id || empresa.id!,
                    estado: !empresa.activo,
                    nombre: empresa.nombre
                });
                break;
            case 'regenerate':
                setRegenerateAction({
                    id: empresa._id || empresa.id!,
                    nombre: empresa.nombre
                });
                break;
            case 'delete':
                setDeletingCompany({
                    id: empresa._id || empresa.id!,
                    nombre: empresa.nombre
                });
                break;
        }
    };

    const verifyPassword = () => {
        if (password === AURONTEK_PASSWORD) {
            if (passwordDialog) {
                executeAction(passwordDialog.action, passwordDialog.company);
            }
            setPasswordDialog(null);
            setPassword('');
        } else {
            toast.error('Contraseña incorrecta');
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
            toast.success('Estado de licencia actualizado');
            setToggleAction(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al actualizar licencia');
            setToggleAction(null);
        }
    });

    // Regenerate Code Mutation
    const regenerateCodeMutation = useMutation({
        mutationFn: companiesService.regenerateCode,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(`Nuevo código generado: ${data.codigo_acceso}`);
            setRegenerateAction(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al regenerar código');
            setRegenerateAction(null);
        }
    });

    // Delete Company Mutation
    const deleteCompanyMutation = useMutation({
        mutationFn: companiesService.deleteCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success('Empresa eliminada correctamente');
            setDeletingCompany(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al eliminar empresa');
            setDeletingCompany(null);
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toggle License Confirmation */}
            <AlertDialog open={!!toggleAction} onOpenChange={(open) => !open && setToggleAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleAction?.estado ? 'Activar' : 'Suspender'} Licencia
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas {toggleAction?.estado ? 'activar' : 'suspender'} la licencia de <strong>{toggleAction?.nombre}</strong>?
                            {!toggleAction?.estado && ' Los usuarios de esta empresa no podrán acceder al sistema.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={toggleAction?.estado ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                            onClick={() => toggleAction && toggleLicenseMutation.mutate({
                                id: toggleAction.id,
                                estado: toggleAction.estado
                            })}
                        >
                            {toggleAction?.estado ? 'Activar' : 'Suspender'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Regenerate Code Confirmation */}
            <AlertDialog open={!!regenerateAction} onOpenChange={(open) => !open && setRegenerateAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regenerar Código de Acceso</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de regenerar el código de acceso para <strong>{regenerateAction?.nombre}</strong>?
                            El código anterior dejará de funcionar inmediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => regenerateAction && regenerateCodeMutation.mutate(regenerateAction.id)}
                        >
                            Regenerar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Company Confirmation */}
            <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-slate-100">Eliminar Empresa</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-300">
                            ¿Estás seguro de eliminar <strong className="text-red-600 dark:text-red-400">{deletingCompany?.nombre}</strong>?
                            <br /><br />
                            <span className="text-red-600 dark:text-red-400 font-semibold">⚠️ Esta acción NO se puede deshacer.</span>
                            <br />
                            Se eliminarán todos los datos asociados: usuarios, tickets, configuraciones, etc.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                            onClick={() => deletingCompany && deleteCompanyMutation.mutate(deletingCompany.id)}
                        >
                            Eliminar Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Password Dialog for Aurontek */}
            <Dialog open={!!passwordDialog} onOpenChange={(open) => {
                if (!open) {
                    setPasswordDialog(null);
                    setPassword('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Acción Protegida - Aurontek</DialogTitle>
                        <DialogDescription>
                            Esta empresa requiere autenticación adicional. Ingresa la contraseña de administrador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="aurontek-password">Contraseña</Label>
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
                            Cancelar
                        </Button>
                        <Button onClick={verifyPassword}>
                            Verificar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h2>
                    <p className="text-slate-500">Administra a tus clientes y sus licencias.</p>
                </div>
                {!isCreating && !editingCompany && (
                    <ProtectedButton
                        permission={PERMISSIONS.COMPANIES_MANAGE}
                        onClick={() => setIsCreating(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
                    </ProtectedButton>
                )}
            </div>

            {(isCreating || editingCompany) && (
                <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</CardTitle>
                        <CardDescription>
                            {editingCompany ? 'Modifica los datos de la empresa.' : 'Registra una nueva empresa cliente.'}
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
                    <CardTitle>Directorio de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Cargando empresas...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>RFC</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies?.map((empresa) => (
                                    <TableRow key={empresa._id || empresa.id}>
                                        <TableCell className="font-medium">{empresa.nombre}</TableCell>
                                        <TableCell>{empresa.rfc}</TableCell>
                                        <TableCell>{empresa.correo}</TableCell>
                                        <TableCell>
                                            {empresa.licencia?.[0]?.plan || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={empresa.activo ? "default" : "destructive"}>
                                                {empresa.activo ? 'Activo' : 'Suspendido'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <ProtectedButton
                                                permission={PERMISSIONS.COMPANIES_MANAGE}
                                                variant="ghost"
                                                size="icon"
                                                title="Editar"
                                                onClick={() => handleProtectedAction('edit', empresa)}
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </ProtectedButton>

                                            <ProtectedButton
                                                permission={PERMISSIONS.COMPANIES_MANAGE}
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
                                                permission={PERMISSIONS.COMPANIES_MANAGE}
                                                variant="ghost"
                                                size="icon"
                                                title="Regenerar Código Acceso"
                                                onClick={() => handleProtectedAction('regenerate', empresa)}
                                            >
                                                <Key className="h-4 w-4 text-blue-500" />
                                            </ProtectedButton>

                                            <ProtectedButton
                                                permission={PERMISSIONS.COMPANIES_MANAGE}
                                                variant="ghost"
                                                size="icon"
                                                title="Eliminar Empresa"
                                                onClick={() => handleProtectedAction('delete', empresa)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </ProtectedButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {companies?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                            No hay empresas registradas.
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
