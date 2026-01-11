import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService, Service } from '@/api/services.service';
import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload, FileDown, Globe, Building } from 'lucide-react';
import ServiceForm from './ServiceForm';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
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
import { PERMISSIONS } from '@/constants/permissions';

const ServicesPage = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();

    // Check for 'tipo' or 'alcance' in URL
    const urlScope = searchParams.get('tipo') || searchParams.get('alcance');
    const initialTab = urlScope === 'local' ? 'local' : 'global';

    // Sync active tab with URL if present
    useEffect(() => {
        if (urlScope === 'local') setActiveTab('local');
        else if (urlScope === 'global') setActiveTab('global');
    }, [urlScope]);

    const [isCreating, setIsCreating] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'global' | 'local'>(initialTab as 'global' | 'local');
    const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

    // Update title based on active tab or URL param
    const pageTitle = activeTab === 'local' ? t('services.title_internal') : t('services.title');

    // Get the permission based on active tab
    // Get the permission based on active tab
    // const requiredPermission = ... (Removed)

    // Fetch Services based on active tab
    const { data: services = [], isLoading } = useQuery({
        queryKey: ['services', activeTab],
        queryFn: () => servicesService.getServices(activeTab)
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: servicesService.deleteService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success(t('services.messages.deleted'));
            setDeletingServiceId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('services.messages.delete_error'));
            setDeletingServiceId(null);
        }
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: servicesService.bulkUpload,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success(t('services.messages.upload_success', { msg: data.msg || 'OK' }));
        },
        onError: () => toast.error(t('services.messages.upload_error'))
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    const handleDelete = (id: string) => {
        setDeletingServiceId(id);
    };

    const ServiceTable = ({ data, readonly = false }: { data: Service[], readonly?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('services.table.name')}</TableHead>
                    <TableHead>{t('services.table.type')}</TableHead>
                    <TableHead>{t('services.table.priority')}</TableHead>
                    <TableHead>{t('services.table.sla')}</TableHead>
                    <TableHead>{t('services.table.status')}</TableHead>
                    {!readonly && <TableHead className="text-right">{t('common.actions')}</TableHead>}
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
                                {service.activo ? t('common.active') : t('common.inactive')}
                            </Badge>
                        </TableCell>
                        {!readonly && (
                            <TableCell className="text-right">
                                <ProtectedButton
                                    permission={activeTab === 'global' ? PERMISSIONS.SERVICIOS_EDIT_GLOBAL : PERMISSIONS.SERVICIOS_EDIT_LOCAL}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setEditingService(service); setIsCreating(false); }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </ProtectedButton>
                                <ProtectedButton
                                    permission={activeTab === 'global' ? PERMISSIONS.SERVICIOS_DELETE_GLOBAL : PERMISSIONS.SERVICIOS_DELETE_LOCAL}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(service._id!)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </ProtectedButton>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                            {t('services.messages.no_data')}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Alert Dialog */}
            <AlertDialog open={!!deletingServiceId} onOpenChange={(open) => !open && setDeletingServiceId(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-slate-100">{t('common.delete_permanently')}?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-300">
                            {t('common.confirm_delete')} {t('common.irreversible_action')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingServiceId && deleteMutation.mutate(deletingServiceId)}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
                    <p className="text-slate-500">{t('services.subtitle')}</p>
                </div>
                {!isCreating && !editingService && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => servicesService.downloadTemplate(activeTab)}>
                            <FileDown className="mr-2 h-4 w-4" /> {t('services.template')}
                        </Button>
                        <ProtectedButton
                            permission={PERMISSIONS.SERVICIOS_IMPORT}
                            variant="outline"
                            className="relative"
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".csv"
                            />
                            <Upload className="mr-2 h-4 w-4" /> {t('services.import')}
                        </ProtectedButton>
                        <ProtectedButton
                            permission={activeTab === 'global' ? PERMISSIONS.SERVICIOS_CREATE_GLOBAL : PERMISSIONS.SERVICIOS_CREATE_LOCAL}
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> {t('services.new_service')}
                        </ProtectedButton>
                    </div>
                )}
            </div>

            {(isCreating || editingService) ? (
                <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="bg-blue-50/50">
                        <CardTitle>{editingService ? t('services.edit_service') : t('services.new_service')}</CardTitle>
                        <CardDescription>{t('services.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ServiceForm
                            service={editingService}
                            initialScope={activeTab}
                            onSuccess={() => { setIsCreating(false); setEditingService(undefined); }}
                            onCancel={() => { setIsCreating(false); setEditingService(undefined); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardContent className="p-0">
                        <Tabs defaultValue={initialTab} value={activeTab} onValueChange={(v) => setActiveTab(v as 'global' | 'local')} className="w-full">
                            {!urlScope && (
                                <div className="border-b px-4 bg-slate-50/50">
                                    <TabsList className="bg-transparent">
                                        <TabsTrigger value="global" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Globe className="mr-2 h-4 w-4" /> {t('services.tabs.global')}
                                        </TabsTrigger>
                                        <TabsTrigger value="local" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Building className="mr-2 h-4 w-4" /> {t('services.tabs.local')}
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            )}

                            {/* We reuse the services list for both, as it re-fetches on tab change */}
                            <TabsContent value="global" className="p-0 border-none m-0">
                                <ServiceTable data={services} />
                            </TabsContent>
                            <TabsContent value="local" className="p-0 border-none m-0">
                                <ServiceTable data={services} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ServicesPage;
