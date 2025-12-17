import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { servicesService } from '@/api/services.service';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CreateTicket = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [serviceId, setServiceId] = useState('');

    // Fetch Services
    const { data: services } = useQuery({
        queryKey: ['services'],
        queryFn: servicesService.getServices
    });

    const createTicketMutation = useMutation({
        mutationFn: ticketsService.createTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            toast.success('Ticket creado exitosamente');
            navigate('/empresa/dashboard');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al crear ticket');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!serviceId) {
            toast.error('Por favor selecciona un servicio');
            return;
        }

        const selectedService = services?.find(s => s._id === serviceId);

        createTicketMutation.mutate({
            titulo: title,
            descripcion: description,
            // Datos del catálogo
            servicioId: selectedService?._id, // Enviar ID para referencia
            servicio: selectedService?.nombre || 'General',
            tipo: selectedService?.tipo as any || 'Requerimiento',
            categoria: selectedService?.categoria || 'General',
            prioridad: (selectedService?.prioridad?.toUpperCase() as any) || 'MEDIA',
            // SLA calculo en backend o frontend? Backend tickets now supports 'fechaLimiteResolucion' explicit?
            // Actually, better to let backend calculate or send explicit date if needed.
            // For now sending priority triggers backend logic (which defaults to SLA based on priority).
            // But if we want custom SLA hours from service, we might need to send it or handle in backend.
            metadata: {
                ...selectedService
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reportar Incidente o Requerimiento</h2>
                <p className="text-slate-500">Selecciona el servicio del catálogo para autocompletar la información.</p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-6">

                        {/* Service Selection */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">¿Qué servicio necesitas?</Label>
                            <Select onValueChange={(val) => {
                                setServiceId(val);
                                const s = services?.find(svc => svc._id === val);
                                if (s) {
                                    setTitle(s.nombre); // Auto-suggest title
                                }
                            }}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Selecciona del catálogo..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {services?.filter(s => s.activo !== false).map((service) => (
                                        <SelectItem key={service._id} value={service._id!}>
                                            <div className="flex flex-col text-left">
                                                <span className="font-medium">{service.nombre}</span>
                                                <span className="text-xs text-slate-400 capitalize">{service.tipo} • {service.categoria}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {serviceId && (
                            <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm space-y-1">
                                <p><span className="font-semibold">Categoría:</span> {services?.find(s => s._id === serviceId)?.categoria}</p>
                                <p><span className="font-semibold">SLA Estimado:</span> {services?.find(s => s._id === serviceId)?.sla || 'N/A'}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Asunto</Label>
                            <Input
                                id="title"
                                placeholder="Resumen breve..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Descripción Detallada</Label>
                            <Textarea
                                id="desc"
                                className="min-h-[150px]"
                                placeholder="Describe el problema, incluye mensajes de error o pasos para reproducirlo..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        {/* File Upload Placeholder - User mentioned 'evidencias fotograficas' logic exists in other components but CreateTicket might need it */}
                        {/* Adding description note for now */}
                        <p className="text-xs text-slate-400">Puedes adjuntar evidencias en el detalle del ticket una vez creado.</p>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-slate-50/50 p-6 rounded-b-lg">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                        <Button type="submit" disabled={createTicketMutation.isPending} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                            {createTicketMutation.isPending ? 'Creando...' : 'Crear Ticket'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default CreateTicket;
