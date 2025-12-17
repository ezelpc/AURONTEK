import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { companiesService } from '@/api/companies.service';
import UserForm from './UserForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Pencil, Trash2, Building2, Ban, CheckCircle } from 'lucide-react';
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

const UsersPage = () => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>(''); // '' = Todas
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // 1. Fetch Companies for Filter (Only if Super Admin)
    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: companiesService.getCompanies,
    });

    // 2. Fetch Users (Filtered)
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users', selectedCompany],
        queryFn: () => userService.getUsers(selectedCompany || undefined),
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario eliminado correctamente');
            setDeletingUserId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.msg || 'Error al eliminar usuario');
            setDeletingUserId(null);
        }
    });

    // Toggle Active Status Mutation
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, activo }: { id: string, activo: boolean }) =>
            userService.updateUser(id, { activo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Estado del usuario actualizado');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.msg || 'Error al actualizar usuario');
        }
    });

    const getCompanyName = (id?: string) => {
        if (!id) return 'N/A';
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

    const handleDelete = (userId: string) => {
        setDeletingUserId(userId);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al usuario. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingUserId && deleteMutation.mutate(deletingUserId)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-slate-500">Administración de identidades y accesos.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Company Filter */}
                    <div className="relative">
                        <select
                            className="h-10 w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                        >
                            <option value="">Todas las Empresas</option>
                            {Array.isArray(companies) && companies.map(c => (
                                <option key={c._id || c.id} value={c._id || c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={() => { setEditingUser(null); setShowForm(!showForm); }} variant={showForm ? "secondary" : "default"}>
                        {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {showForm ? 'Cancelar' : 'Nuevo Usuario'}
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="border-blue-200 shadow-lg animate-in slide-in-from-top-4">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingUser ? 'Editar Usuario' : 'Alta de Usuario'}</CardTitle>
                        <CardDescription>
                            {editingUser ? 'Modifica los datos del usuario.' : 'Crea un nuevo usuario asignándole una empresa y rol.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <UserForm
                            userToEdit={editingUser}
                            onSuccess={handleCloseForm}
                        />
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        Directorio Global
                        {selectedCompany && <Badge variant="secondary" className="ml-2 dark:bg-slate-700 dark:text-slate-300">Filtrado</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">Cargando usuarios...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-700">
                                    <TableHead className="dark:text-slate-300">Nombre / Email</TableHead>
                                    <TableHead className="dark:text-slate-300">Empresa</TableHead>
                                    <TableHead className="dark:text-slate-300">Rol / Puesto</TableHead>
                                    <TableHead className="dark:text-slate-300">Estado</TableHead>
                                    <TableHead className="text-right dark:text-slate-300">Acciones</TableHead>
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
                                                {user.rol}
                                            </Badge>
                                            {user.puesto && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.puesto}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.activo ? "default" : "secondary"} className={user.activo ? "dark:bg-green-900 dark:text-green-100" : "dark:bg-slate-700 dark:text-slate-300"}>
                                                {user.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(user)}
                                                title="Editar usuario"
                                                className="dark:hover:bg-slate-800"
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleActiveMutation.mutate({
                                                    id: user.id || user._id,
                                                    activo: !user.activo
                                                })}
                                                title={user.activo ? "Suspender usuario" : "Activar usuario"}
                                                className="dark:hover:bg-slate-800"
                                            >
                                                {user.activo ? (
                                                    <Ban className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingUserId(user.id || user._id)}
                                                title="Eliminar usuario"
                                                className="dark:hover:bg-slate-800"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {Array.isArray(users) && users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                            No se encontraron usuarios.
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
