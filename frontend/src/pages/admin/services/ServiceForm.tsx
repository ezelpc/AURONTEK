import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/auth/auth.store';
import { Service, servicesService } from '@/api/services.service';
import { careGroupsService } from '@/api/care-groups.service';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ServiceFormProps {
    service?: Service;
    initialScope?: 'global' | 'local';
    onSuccess: () => void;
    onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, initialScope, onSuccess, onCancel }) => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isEdit = !!service;

    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Service>({
        defaultValues: {
            activo: true,
            alcance: service?.alcance || initialScope || (user?.esAdminGeneral ? 'global' : 'local'),
            prioridad: 'Media',
            ...service
        }
    });

    // Fetch care groups
    const { data: careGroups = [] } = useQuery<any[]>({
        queryKey: ['careGroups'],
        queryFn: careGroupsService.getAll
    });

    // Initialize selected groups from service
    useEffect(() => {
        if (service?.gruposDeAtencion) {
            const groups = service.gruposDeAtencion.split(',').map(g => g.trim()).filter(Boolean);
            setSelectedGroups(groups);
        }
    }, [service]);

    // Watch values for select components
    const alcance = watch('alcance');
    const prioridad = watch('prioridad');

    const mutation = useMutation({
        mutationFn: (data: Service) => {
            if (isEdit && service._id) {
                return servicesService.updateService(service._id, data);
            }
            return servicesService.createService(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success(isEdit ? 'Servicio actualizado' : 'Servicio creado');
            onSuccess();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al guardar servicio');
        }
    });

    const onSubmit = (data: Service) => {
        // Convert selected groups array to comma-separated string
        const gruposString = selectedGroups.join(', ');
        mutation.mutate({ ...data, gruposDeAtencion: gruposString });
    };

    const handleAddGroup = (groupName: string) => {
        if (groupName && !selectedGroups.includes(groupName)) {
            setSelectedGroups([...selectedGroups, groupName]);
        }
    };

    const handleRemoveGroup = (groupName: string) => {
        setSelectedGroups(selectedGroups.filter(g => g !== groupName));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

                {/* Nombre */}
                <div className="col-span-2">
                    <Label htmlFor="nombre" className="dark:text-slate-200">Nombre del Servicio *</Label>
                    <Input
                        id="nombre"
                        {...register('nombre', { required: 'Requerido' })}
                        placeholder="Ej: Falla de VPN"
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                    {errors.nombre && <span className="text-red-500 dark:text-red-400 text-xs">{errors.nombre.message}</span>}
                </div>

                {/* Alcance (Solo Admin General puede elegir Global) */}
                <div>
                    <Label className="dark:text-slate-200">Alcance</Label>
                    <Select
                        value={alcance}
                        onValueChange={(val: any) => setValue('alcance', val)}
                        disabled={!user?.esAdminGeneral} // Only Super Admin can change scope
                    >
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                            <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectItem value="global" className="dark:text-slate-100 dark:hover:bg-slate-700">Global (Aurontek)</SelectItem>
                            <SelectItem value="local" className="dark:text-slate-100 dark:hover:bg-slate-700">Local (Mi Empresa)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tipo */}
                <div>
                    <Label className="dark:text-slate-200">Tipo</Label>
                    <Select onValueChange={(val) => setValue('tipo', val as any)} defaultValue={watch('tipo')}>
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectItem value="Incidente" className="dark:text-slate-100 dark:hover:bg-slate-700">Incidente</SelectItem>
                            <SelectItem value="Requerimiento" className="dark:text-slate-100 dark:hover:bg-slate-700">Requerimiento</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Categoría */}
                <div>
                    <Label htmlFor="categoria" className="dark:text-slate-200">Categoría</Label>
                    <Input
                        id="categoria"
                        {...register('categoria', { required: 'Requerido' })}
                        placeholder="Ej: Hardware, Software, Redes"
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                    {errors.categoria && <span className="text-red-500 dark:text-red-400 text-xs">{errors.categoria.message}</span>}
                </div>

                {/* Prioridad */}
                <div>
                    <Label className="dark:text-slate-200">Prioridad Defecto</Label>
                    <Select value={prioridad} onValueChange={(val: any) => setValue('prioridad', val)}>
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectItem value="Baja" className="dark:text-slate-100 dark:hover:bg-slate-700">Baja</SelectItem>
                            <SelectItem value="Media" className="dark:text-slate-100 dark:hover:bg-slate-700">Media</SelectItem>
                            <SelectItem value="Alta" className="dark:text-slate-100 dark:hover:bg-slate-700">Alta</SelectItem>
                            <SelectItem value="Crítica" className="dark:text-slate-100 dark:hover:bg-slate-700">Crítica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* SLA */}
                <div>
                    <Label htmlFor="sla" className="dark:text-slate-200">SLA (Tiempo Respuesta)</Label>
                    <Input
                        id="sla"
                        {...register('sla')}
                        placeholder="Ej: 4 horas"
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                </div>

                {/* Grupos Atención - NUEVO SELECT */}
                <div className="col-span-2">
                    <Label className="dark:text-slate-200">Grupos de Atención</Label>
                    <Select
                        value=""
                        onValueChange={handleAddGroup}
                    >
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                            <SelectValue placeholder="Seleccionar grupos de atención" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            {careGroups.map((group: any) => (
                                <SelectItem
                                    key={group._id}
                                    value={group.nombre}
                                    className="dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    {group.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Selected groups as badges */}
                    {selectedGroups.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedGroups.map((groupName, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm"
                                >
                                    <span>{groupName}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGroup(groupName)}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <div className="col-span-2">
                    <Label htmlFor="descripcion" className="dark:text-slate-200">Descripción</Label>
                    <Textarea
                        id="descripcion"
                        {...register('descripcion')}
                        placeholder="Detalles del servicio..."
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                </Button>
            </div>
        </form>
    );
};

export default ServiceForm;
