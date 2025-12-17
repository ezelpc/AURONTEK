import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService, Service } from '@/api/services.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload, FileDown, Globe, Building } from 'lucide-react';
import ServiceForm from './ServiceForm';
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

const ServicesPage = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);
    const [activeTab, setActiveTab] = useState('global');
    const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

    // Fetch Services
    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: servicesService.getServices
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: servicesService.deleteService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success('Servicio eliminado');
            setDeletingServiceId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al eliminar servicio');
            setDeletingServiceId(null);
        }
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: servicesService.bulkUpload,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success(`Carga masiva completada: ${data.msg || 'OK'}`);
        },
        onError: () => toast.error('Error en carga masiva')
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    const handleDelete = (id: string) => {
        setDeletingServiceId(id);
    };

    // Filters
    const globalServices = services?.filter(s => s.alcance === 'global') || [];
    const localServices = services?.filter(s => s.alcance === 'local') || [];

    const ServiceTable = ({ data, readonly = false }: { data: Service[], readonly?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Estado</TableHead>
                    {!readonly && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((service) => (
                    <TableRow key={service._id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{service.nombre}</span>
                                <span className="text-xs text-slate-500 truncate max-w-[200px]">{service.descripcion}</span>
                            </div>
                        </TableCell>
                        <TableCell>{service.tipo}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                service.prioridad === 'Crítica' ? 'border-red-500 text-red-500' :
                                    service.prioridad === 'Alta' ? 'border-orange-500 text-orange-500' :
                                        'border-slate-500 text-slate-500'
                            }>
                                {service.prioridad}
                            </Badge>
                        </TableCell>
                        <TableCell>{service.sla}</TableCell>
                        <TableCell>
                            <Badge variant={service.activo ? 'default' : 'secondary'}>
                                {service.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </TableCell>
                        {!readonly && (
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingService(service); setIsCreating(false); }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(service._id!)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                            No hay servicios registrados en esta categoría.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Cargando catálogo...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingServiceId} onOpenChange={(open) => !open && setDeletingServiceId(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-slate-100">¿Eliminar servicio?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-300">
                            Esta acción eliminará permanentemente este servicio del catálogo. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingServiceId && deleteMutation.mutate(deletingServiceId)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h2>
                    <p className="text-slate-500">Gestiona la oferta de servicios para tickets.</p>
                </div>
                {!isCreating && !editingService && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={servicesService.downloadTemplate}>
                            <FileDown className="mr-2 h-4 w-4" /> Plantilla
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".csv"
                            />
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" /> Importar
                            </Button>
                        </div>
                        <Button onClick={() => setIsCreating(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                        </Button>
                    </div>
                )}
            </div>

            {(isCreating || editingService) ? (
                <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</CardTitle>
                        <CardDescription>Define los parámetros del servicio, SLA y responsables.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ServiceForm
                            service={editingService}
                            onSuccess={() => { setIsCreating(false); setEditingService(undefined); }}
                            onCancel={() => { setIsCreating(false); setEditingService(undefined); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardContent className="p-0">
                        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="border-b px-4 bg-slate-50/50">
                                <TabsList className="bg-transparent">
                                    <TabsTrigger value="global" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Globe className="mr-2 h-4 w-4" /> Globales (Aurontek)
                                    </TabsTrigger>
                                    <TabsTrigger value="local" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Building className="mr-2 h-4 w-4" /> Locales (Empresas)
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="global" className="p-0 border-none m-0">
                                <ServiceTable data={globalServices} />
                            </TabsContent>
                            <TabsContent value="local" className="p-0 border-none m-0">
                                <ServiceTable data={localServices} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ServicesPage;
