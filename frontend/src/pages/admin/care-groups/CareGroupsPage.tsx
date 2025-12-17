import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/auth/auth.store';
import { careGroupsService, CareGroup } from '@/api/care-groups.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';


const CareGroupsPage = () => {
    const queryClient = useQueryClient();
    const { hasPermission } = useAuthStore();
    const canManage = hasPermission('habilities.manage');

    const [isOpen, setIsOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CareGroup | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['care-groups'],
        queryFn: careGroupsService.getAll
    });

    const { register, handleSubmit, reset, setValue } = useForm<{ nombre: string; descripcion: string }>();

    const createMutation = useMutation({
        mutationFn: careGroupsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['care-groups'] });
            toast.success('Grupo de atención creado');
            setIsOpen(false);
            reset();
        },
        onError: () => toast.error('Error al crear grupo')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CareGroup> }) =>
            careGroupsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['care-groups'] });
            toast.success('Grupo actualizado');
            setIsOpen(false);
            setEditingGroup(null);
            reset();
        },
        onError: () => toast.error('Error al actualizar grupo')
    });

    const deleteMutation = useMutation({
        mutationFn: careGroupsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['care-groups'] });
            toast.success('Grupo eliminado');
            setDeletingId(null);
        },
        onError: () => toast.error('Error al eliminar grupo')
    });

    const onSubmit = (data: { nombre: string; descripcion: string }) => {
        if (editingGroup) {
            updateMutation.mutate({ id: editingGroup._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (group: CareGroup) => {
        setEditingGroup(group);
        setValue('nombre', group.nombre);
        setValue('descripcion', group.descripcion || '');
        setIsOpen(true);
    };

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este grupo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el grupo de atención permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (deletingId) deleteMutation.mutate(deletingId);
                            }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Grupos de Atención</h2>
                    <p className="text-slate-500">Gestiona los grupos resolutores y áreas de servicio.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingGroup(null);
                        reset();
                    }
                }}>
                    {canManage && (
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Grupo</Button>
                        </DialogTrigger>
                    )}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
                            <DialogDescription>
                                {editingGroup ? 'Modifica los datos del grupo' : 'Agrega un grupo de atención al catálogo'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="nombre">Nombre del Grupo</Label>
                                <Input id="nombre" {...register('nombre', { required: true })} placeholder="ej. Soporte TI" />
                            </div>
                            <div>
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Input id="descripcion" {...register('descripcion')} placeholder="Breve descripción" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {editingGroup ? 'Actualizar' : 'Crear'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Catálogo de Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map((group) => (
                                <TableRow key={group._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            {group.nombre}
                                        </div>
                                    </TableCell>
                                    <TableCell>{group.descripcion || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {canManage && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(group)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingId(group._id || '')}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {groups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-slate-500">
                                        No hay grupos registrados.
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

export default CareGroupsPage;
