import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { servicesService, Service } from '@/api/services.service';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/auth/auth.store';
import { Globe, Building2, ChevronRight, ArrowLeft, CheckCircle2, LayoutGrid, FileText, Paperclip, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';


type Step = 'scope' | 'category' | 'service' | 'details';

const CreateTicket = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { user, hasPermission } = useAuthStore();

    // State for Wizard
    const [step, setStep] = useState<Step>('scope');
    const [selectedScope, setSelectedScope] = useState<'global' | 'local' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [customFields, setCustomFields] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<{ url: string; nombre: string; tipo: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    // Reset details when service changes
    useEffect(() => {
        setCustomFields({});
    }, [selectedService]);

    // Permission Check
    // "tickets.create_global" is the permission to create tickets in global services
    const canCreateGlobal = hasPermission('tickets.create_global') || hasPermission('*');

    // Effect: Auto-select scope if no permission
    useEffect(() => {
        // If user doesn't have permission for global, skip scope selection and go to local/category
        if (!canCreateGlobal && step === 'scope') {
            setSelectedScope('local');
            setStep('category');
        }
    }, [canCreateGlobal, step]);

    // Fetch Services based on Scope
    const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
        queryKey: ['services', selectedScope],
        queryFn: async () => {
            if (!selectedScope) return [];
            return await servicesService.getServices(selectedScope);
        },
        enabled: !!selectedScope
    });

    // Derive Categories (Areas) from Services
    const categories = Array.from(new Set(services?.map(s => s.area || s.categoria || 'General'))).sort();

    // Filter Services by Category
    const filteredServices = services?.filter(s => (s.area || s.categoria || 'General') === selectedCategory);

    const createTicketMutation = useMutation({
        mutationFn: ticketsService.createTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            toast.success(t('company_portal.create_ticket.success'));
            navigate('/empresa/dashboard');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('company_portal.create_ticket.error'));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService) return;

        createTicketMutation.mutate({
            titulo: title,
            descripcion: description,
            servicioId: selectedService._id,
            servicio: selectedService.nombre,
            tipo: selectedService.tipo.toLowerCase(),
            categoria: selectedService.categoria || selectedService.area,
            prioridad: (selectedService.prioridad?.toLowerCase() as any) || 'media',
            metadata: { ...selectedService, ...customFields },
            adjuntos: attachments
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
            toast.error('Cloudinary no configurado');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aurontek_users');
        formData.append('folder', 'tickets'); // Using 'tickets' folder as per request

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error uploading file');
            }

            const data = await response.json();

            setAttachments(prev => [...prev, {
                url: data.secure_url,
                nombre: file.name,
                tipo: file.type
            }]);

            toast.success('Archivo subido correctamente');
        } catch (error: any) {
            console.error('Upload error:', error);
            const msg = error.message || 'Error al subir archivo';
            if (msg.includes('preset')) {
                toast.error('Error: Preset de Cloudinary no encontrado o mal configurado.');
            } else {
                toast.error(`Error al subir archivo: ${msg}`);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };


    const handleBack = () => {
        if (step === 'details') setStep('service');
        else if (step === 'service') setStep('category');
        else if (step === 'category') {
            if (canCreateGlobal) setStep('scope');
            else navigate(-1);
        }
        else if (step === 'scope') navigate(-1);
    };

    // --- STEP RENDERS (Converted to functions to avoid remounting issues) ---

    // 1. Scope Selection
    const renderScopeSelection = () => (
        <div className="grid md:grid-cols-2 gap-4">
            <Card
                className="cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                onClick={() => { setSelectedScope('global'); setStep('category'); }}
            >
                <CardHeader>
                    <Globe className="w-10 h-10 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <CardTitle>Servicios de Sistema</CardTitle>
                    <CardDescription>Infraestructura, Redes, Servidores gestionados por Aurontek.</CardDescription>
                </CardHeader>
            </Card>

            <Card
                className="cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                onClick={() => { setSelectedScope('local'); setStep('category'); }}
            >
                <CardHeader>
                    <Building2 className="w-10 h-10 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <CardTitle>Servicios Internos</CardTitle>
                    <CardDescription>Soporte local, Mantenimiento, RH y servicios de {user?.empresa || 'tu empresa'}.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );

    // 2. Category Selection
    const renderCategorySelection = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(cat => (
                <Button
                    key={cat}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600"
                    onClick={() => { setSelectedCategory(cat); setStep('service'); }}
                >
                    <LayoutGrid className="w-6 h-6" />
                    <span className="text-wrap text-center">{cat}</span>
                </Button>
            ))}
            {categories.length === 0 && !isLoadingServices && (
                <div className="col-span-full text-center py-10 text-slate-500">
                    No hay servicios configurados para esta área.
                </div>
            )}
            {isLoadingServices && <div className="col-span-full text-center py-10">Cargando catálogo...</div>}
        </div>
    );

    // 3. Service Selection
    const renderServiceSelection = () => (
        <div className="space-y-2">
            {filteredServices.map(svc => (
                <Card
                    key={svc._id}
                    className="cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => {
                        setSelectedService(svc);
                        setTitle(svc.nombre); // Pre-fill title
                        setStep('details');
                    }}
                >
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">{svc.nombre}</h4>
                                <p className="text-sm text-slate-500">{svc.descripcion}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                </Card>
            ))}
            {filteredServices.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    No hay servicios disponibles en esta categoría.
                </div>
            )}
        </div>
    );

    // 4. Ticket Form
    const renderTicketForm = () => (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle>Ticket: {selectedService?.nombre}</CardTitle>
                            <CardDescription>
                                {selectedScope === 'global' ? 'Servicio Global (Aurontek)' : `Servicio Interno (${user?.empresa})`} • {selectedCategory}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded border">
                            <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Tipo</span>
                            {selectedService?.tipo}
                        </div>
                        <div className="bg-slate-50 p-3 rounded border">
                            <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">SLA Estimado</span>
                            {selectedService?.sla || 'N/A'}
                        </div>
                    </div>

                    {/* Dynamic Template Fields */}
                    {selectedService?.plantilla && selectedService.plantilla.length > 0 && (
                        <div className="space-y-4 p-4 bg-slate-50 rounded-md border border-slate-100">
                            <h4 className="font-medium text-sm text-slate-700">Información Requerida</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                {selectedService.plantilla.map((field, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <Label>
                                            {field.campo}
                                            {field.requerido && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        {field.tipo === 'lista' ? (
                                            <div className="relative">
                                                <select
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                                    value={customFields[field.campo] || ''}
                                                    onChange={(e) => setCustomFields(prev => ({ ...prev, [field.campo]: e.target.value }))}
                                                    required={field.requerido}
                                                >
                                                    <option value="" disabled>Seleccionar...</option>
                                                    {field.opciones?.map(op => (
                                                        <option key={op} value={op}>{op}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <Input
                                                type={field.tipo === 'numero' ? 'number' : field.tipo === 'fecha' ? 'date' : 'text'}
                                                value={customFields[field.campo] || ''}
                                                onChange={(e) => setCustomFields(prev => ({ ...prev, [field.campo]: e.target.value }))}
                                                required={field.requerido}
                                                placeholder={`Ingresa ${field.campo}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">{t('company_portal.create_ticket.subject')}</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc">{t('company_portal.create_ticket.description')}</Label>
                        <Textarea
                            id="desc"
                            className="min-h-[150px]"
                            placeholder={t('company_portal.create_ticket.description_placeholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('company_portal.create_ticket.attachments_label') || 'Archivos y Evidencia'}</Label>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-100 border p-2 rounded-md text-sm group relative">
                                        {file.tipo.startsWith('image/') ? (
                                            <ImageIcon className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-slate-500" />
                                        )}
                                        <span className="max-w-[150px] truncate">{file.nombre}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="ml-1 text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-fit gap-2"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Paperclip className="w-4 h-4" />
                                )}
                                {uploading ? 'Subiendo...' : 'Adjuntar archivo o imagen'}
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">{t('company_portal.create_ticket.evidence_note')}</p>

                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-slate-50 p-4">
                    <Button type="button" variant="outline" onClick={handleBack}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createTicketMutation.isPending} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                        {createTicketMutation.isPending ? t('company_portal.create_ticket.creating') : t('company_portal.create_ticket.create_btn')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack} disabled={!canCreateGlobal && step === 'category'}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {step === 'scope' && 'Selecciona el Alcance'}
                        {step === 'category' && 'Selecciona el Área'}
                        {step === 'service' && 'Selecciona el Servicio'}
                        {step === 'details' && 'Detalles del Ticket'}
                    </h2>
                    <p className="text-slate-500">
                        {step === 'scope' && '¿Qué tipo de servicio necesitas?'}
                        {step === 'category' && `Explorando servicios ${selectedScope === 'global' ? 'Globales' : 'Locales'}`}
                        {step === 'service' && `Servicios disponibles en ${selectedCategory}`}
                        {step === 'details' && 'Completa la información requerida'}
                    </p>
                </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 overflow-x-auto">
                <span className={cn(step === 'scope' && "text-blue-600 font-bold")}>Alcance</span>
                <ChevronRight className="w-4 h-4" />
                <span className={cn(step === 'category' && "text-blue-600 font-bold")}>Área</span>
                <ChevronRight className="w-4 h-4" />
                <span className={cn(step === 'service' && "text-blue-600 font-bold")}>Servicio</span>
                <ChevronRight className="w-4 h-4" />
                <span className={cn(step === 'details' && "text-blue-600 font-bold")}>Detalles</span>
            </div>

            {/* Step Content */}
            {step === 'scope' && renderScopeSelection()}
            {step === 'category' && renderCategorySelection()}
            {step === 'service' && renderServiceSelection()}
            {step === 'details' && renderTicketForm()}
        </div>
    );
};

export default CreateTicket;
