import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesService, Service } from '@/api/services.service';
import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload, FileDown } from 'lucide-react';
import ServiceForm from '@/pages/admin/services/ServiceForm';
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
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "@/auth/auth.store";
import { PERMISSIONS } from '@/constants/permissions';

const CompanyServicesPage = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { hasPermission } = useAuthStore();

    const [isCreating, setIsCreating] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);
    const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

    // Always fetch LOCAL services only
    const { data: services = [], isLoading } = useQuery({
        queryKey: ['services', 'local'],
        queryFn: () => servicesService.getServices('local')
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
                    <h2 className="text-3xl font-bold tracking-tight">{t('services.title_internal')}</h2>
                    <p className="text-slate-500">{t('services.subtitle')}</p>
                </div>
                {!isCreating && !editingService && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => servicesService.downloadTemplate('local')}>
                            <FileDown className="mr-2 h-4 w-4" /> {t('services.template')}
                        </Button>
                        {hasPermission(PERMISSIONS.SERVICIOS_IMPORT) && (
                            <div className="relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    accept=".csv"
                                />
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" /> {t('services.import')}
                                </Button>
                            </div>
                        )}
                        <ProtectedButton
                            permission={PERMISSIONS.SERVICIOS_CREATE_LOCAL}
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
                            initialScope="local"
                            onSuccess={() => { setIsCreating(false); setEditingService(undefined); }}
                            onCancel={() => { setIsCreating(false); setEditingService(undefined); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardContent className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('services.table.name')}</TableHead>
                                    <TableHead>{t('services.table.type')}</TableHead>
                                    <TableHead>{t('services.table.priority')}</TableHead>
                                    <TableHead>{t('services.table.sla')}</TableHead>
                                    <TableHead>{t('services.table.status')}</TableHead>
                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
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
                                        <TableCell className="text-right">
                                            <ProtectedButton
                                                permission={PERMISSIONS.SERVICIOS_EDIT_LOCAL}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingService(service); setIsCreating(false); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </ProtectedButton>
                                            <ProtectedButton
                                                permission={PERMISSIONS.SERVICIOS_DELETE_LOCAL}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(service._id!)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </ProtectedButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {services.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                            {t('services.messages.no_data')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CompanyServicesPage;
