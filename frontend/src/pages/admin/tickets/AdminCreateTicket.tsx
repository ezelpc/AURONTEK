import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { servicesService } from '@/api/services.service';
import { useAuthStore } from '@/auth/auth.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, ChevronRight, Upload, Search, Monitor, Wrench, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const AdminCreateTicket = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // Estados del flujo jerárquico
    const [step, setStep] = useState<'area' | 'type' | 'subcategory' | 'service' | 'form'>('area');
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [selectedType, setSelectedType] = useState<'Requerimiento' | 'Incidente' | ''>('');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [descripcion, setDescripcion] = useState('');
    const [adjuntos, setAdjuntos] = useState<File[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Fetch servicios INTERNOS
    const { data: servicios = [], isLoading } = useQuery({
        queryKey: ['servicios-internos'],
        queryFn: async () => {
            const all = await servicesService.getServices();
            // Filtrar solo servicios INTERNOS
            return Array.isArray(all) ? all.filter((s: any) => s.alcance === 'INTERNO' || s.alcance === 'PLATAFORMA') : [];
        },
    });

    // Definición de Áreas (Virtuales por ahora)
    const areasVirtuales = [
        { id: 'TI', nombre: 'Tecnología de la Información', icon: <Monitor className="h-8 w-8 mb-2" /> },
        { id: 'RRHH', nombre: 'Recursos Humanos (Demo)', icon: <Wrench className="h-8 w-8 mb-2" /> }
    ];

    // Obtener subcategorías únicas
    const subcategories = Array.from(
        new Set(
            servicios
                .filter((_) => {
                    if (selectedArea === 'TI') return true;
                    return false;
                })
                .filter((s: any) => s.tipo === selectedType)
                .map((s: any) => s.categoria)
        )
    ).sort();

    // Filtrar servicios por tipo y subcategoría
    const filteredServices = servicios.filter((s: any) =>
        s.tipo === selectedType &&
        s.categoria === selectedSubcategory &&
        (searchTerm === '' || s.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const createMutation = useMutation({
        mutationFn: (data: any) => ticketsService.createTicket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket creado exitosamente');
            navigate('/admin/tickets');
        },
        onError: (error: any) => {
            toast.error(`Error al crear ticket: ${error.message}`);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let uploadedAttachments: any[] = [];

            // 1. Subir archivos si existen
            if (adjuntos.length > 0) {
                setIsUploading(true);
                try {
                    const filesData = await ticketsService.uploadFiles(adjuntos);
                    uploadedAttachments = filesData.map((f: any) => ({
                        nombre: f.nombre,
                        url: f.url,
                        tipo: f.tipo
                    }));
                } catch (error) {
                    console.error('Error subiendo archivos:', error);
                    toast.error('Error al subir archivos adjuntos. Intenta sin archivos o verifica tu conexión.');
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            // 2. Crear ticket
            createMutation.mutate({
                titulo: selectedService.nombre,
                descripcion,
                servicioId: selectedService._id,
                servicioNombre: selectedService.nombre,
                tipo: selectedType.toLowerCase(),
                prioridad: selectedService.prioridad?.toLowerCase() || 'media',
                categoria: selectedSubcategory,
                empresaId: null, // Ticket interno (Backend lo manejará)
                usuarioCreador: user?._id,
                estado: 'abierto',
                adjuntos: uploadedAttachments
            });

        } catch (error) {
            console.error('Error en proceso de creación:', error);
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAdjuntos(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setAdjuntos(prev => prev.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
                <span className="text-slate-500">Cargando catálogo de servicios...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/admin/tickets')} className="text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Tickets
                </Button>
            </div>

            <Card className="border-slate-200 shadow-md">
                <CardHeader className="pb-4 border-b bg-slate-50/50">
                    <CardTitle className="text-xl text-slate-800">Crear Ticket Interno</CardTitle>
                    <CardDescription>
                        Sigue los pasos para clasificar y crear tu solicitud correctamente
                    </CardDescription>

                    {/* Navegación Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm mt-4 flex-wrap">
                        <span
                            className={`cursor-pointer hover:underline flex items-center ${step === 'area' ? 'font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded' : 'text-slate-600'}`}
                            onClick={() => step !== 'area' && setStep('area')}
                        >
                            {selectedArea || '1. Área'}
                        </span>

                        {selectedArea && (
                            <>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                <span
                                    className={`cursor-pointer hover:underline flex items-center ${step === 'type' ? 'font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded' : 'text-slate-600'}`}
                                    onClick={() => step !== 'type' && setStep('type')}
                                >
                                    {selectedType || '2. Tipo'}
                                </span>
                            </>
                        )}

                        {selectedType && (
                            <>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                <span
                                    className={`cursor-pointer hover:underline flex items-center ${step === 'subcategory' ? 'font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded' : 'text-slate-600'}`}
                                    onClick={() => step !== 'subcategory' && setStep('subcategory')}
                                >
                                    {selectedSubcategory || '3. Categoría'}
                                </span>
                            </>
                        )}

                        {selectedService && (
                            <>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                <span className="font-bold text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded">
                                    4. {selectedService.nombre}
                                </span>
                            </>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6 min-h-[400px]">
                    {/* PASO 1: Seleccionar Área */}
                    {step === 'area' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-xl text-slate-800 text-center mb-8">¿A qué área corresponde tu solicitud?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                {areasVirtuales.map((area) => (
                                    <Button
                                        key={area.id}
                                        variant="outline"
                                        className="h-40 flex-col hover:bg-blue-50 hover:border-blue-500 transition-all border-2"
                                        onClick={() => {
                                            setSelectedArea(area.id);
                                            setStep('type');
                                        }}
                                        disabled={area.id !== 'TI' && servicios.length > 0}
                                    >
                                        <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-white">{area.icon}</div>
                                        <div className="font-bold text-lg">{area.nombre}</div>
                                        {area.id === 'TI' && <div className="text-xs text-slate-500 mt-2 font-normal">{servicios.length} servicios disponibles</div>}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: Seleccionar Tipo (Incidente/Requerimiento) */}
                    {step === 'type' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="font-semibold text-xl text-slate-800 text-center mb-8">¿Qué tipo de solicitud es?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <Button
                                    variant="outline"
                                    className="h-40 flex-col hover:bg-red-50 hover:border-red-500 transition-all border-2"
                                    onClick={() => {
                                        setSelectedType('Incidente');
                                        setStep('subcategory');
                                    }}
                                >
                                    <div className="bg-red-100 p-4 rounded-full mb-3 text-3xl">🚨</div>
                                    <div className="font-bold text-lg">Incidente</div>
                                    <div className="text-sm text-slate-500 mt-2 font-normal">Algo no está funcionando correctamente</div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-40 flex-col hover:bg-green-50 hover:border-green-500 transition-all border-2"
                                    onClick={() => {
                                        setSelectedType('Requerimiento');
                                        setStep('subcategory');
                                    }}
                                >
                                    <div className="bg-green-100 p-4 rounded-full mb-3 text-3xl">📋</div>
                                    <div className="font-bold text-lg">Requerimiento</div>
                                    <div className="text-sm text-slate-500 mt-2 font-normal">Necesito solicitar un nuevo servicio o acceso</div>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: Seleccionar Subcategoría */}
                    {step === 'subcategory' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="font-semibold text-lg text-slate-800">Selecciona la categoría específica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subcategories.map((subcategory: string) => (
                                    <Button
                                        key={subcategory}
                                        variant="outline"
                                        className="h-auto py-4 px-6 justify-start hover:bg-indigo-50 hover:border-indigo-500 transition-all border shadow-sm"
                                        onClick={() => {
                                            setSelectedSubcategory(subcategory);
                                            setStep('service');
                                        }}
                                    >
                                        <div className="text-left w-full">
                                            <div className="font-semibold text-base flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                                {subcategory}
                                            </div>
                                            <div className="text-xs text-slate-500 flex justify-between mt-2 pl-4">
                                                <span>{servicios.filter((s: any) => s.tipo === selectedType && s.categoria === subcategory).length} servicios</span>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 4: Seleccionar Servicio con búsqueda */}
                    {step === 'service' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg text-slate-800">Selecciona el servicio</h3>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar servicio..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                {filteredServices.map((service: any) => (
                                    <Button
                                        key={service._id}
                                        variant="outline"
                                        className="h-auto py-5 px-6 justify-start hover:bg-blue-50 hover:border-blue-500 group transition-all"
                                        onClick={() => {
                                            setSelectedService(service);
                                            setStep('form');
                                        }}
                                    >
                                        <div className="text-left w-full">
                                            <div className="flex justify-between items-start">
                                                <div className="font-semibold text-lg group-hover:text-blue-700 text-slate-800">{service.nombre}</div>
                                                <Badge className={service.prioridad === 'Alta' || service.prioridad === 'Crítica' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'}>
                                                    {service.prioridad || 'Media'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-slate-500 mt-2">{service.descripcion}</div>
                                            {service.sla && (
                                                <div className="mt-3 inline-flex items-center text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 border">
                                                    ⏱️ SLA: {service.sla}
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                ))}
                                {filteredServices.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <Search className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="font-medium">No se encontraron servicios</p>
                                        <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 5: Formulario con plantilla */}
                    {step === 'form' && selectedService && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in zoom-in-95 duration-300">
                            {/* Información del servicio seleccionado */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        {selectedType === 'Incidente' ? '🚨' : '📋'}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-xl text-blue-900">{selectedService.nombre}</h4>
                                        <p className="text-sm text-blue-700 mt-1">{selectedService.descripcion}</p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200/50 text-sm">
                                            <div>
                                                <span className="block text-blue-600/70 text-xs uppercase font-bold mb-1">Área</span>
                                                <span className="font-medium text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded">{selectedArea}</span>
                                            </div>
                                            <div>
                                                <span className="block text-blue-600/70 text-xs uppercase font-bold mb-1">Categoría</span>
                                                <span className="font-medium text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded">{selectedSubcategory}</span>
                                            </div>
                                            <div>
                                                <span className="block text-blue-600/70 text-xs uppercase font-bold mb-1">Prioridad</span>
                                                <span className="font-medium text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded">{selectedService.prioridad || 'Media'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-blue-600/70 text-xs uppercase font-bold mb-1">SLA</span>
                                                <span className="font-medium text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded">{selectedService.sla || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-3">
                                <Label htmlFor="descripcion" className="text-base font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Detalle del {selectedType} <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="descripcion"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Por favor describe detalladamente lo que necesitas o el problema que presentas..."
                                    rows={8}
                                    required
                                    className="resize-none focus:ring-2 focus:ring-blue-500 text-base"
                                />
                            </div>

                            {/* Adjuntos */}
                            <div className="space-y-3">
                                <Label htmlFor="adjuntos" className="text-base font-semibold flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Evidencias (Opcional)
                                </Label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-slate-50 transition-colors cursor-pointer group relative bg-slate-50/50">
                                    <input
                                        type="file"
                                        id="adjuntos"
                                        multiple
                                        accept="image/png, image/jpeg, application/pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center">
                                        <div className="bg-white p-3 rounded-full mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="font-medium text-slate-700 group-hover:text-blue-600">
                                            Arrastra archivos aquí o haz click para buscar
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Soporta imágenes PNG, JPG y PDF (Máx 5MB)
                                        </p>
                                    </div>
                                </div>

                                {adjuntos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 animate-in fade-in">
                                        {adjuntos.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="bg-slate-100 p-1.5 rounded">
                                                        {file.type.includes('pdf') ?
                                                            <span className="text-xs font-bold text-red-500">PDF</span> :
                                                            <span className="text-xs font-bold text-blue-500">IMG</span>
                                                        }
                                                    </div>
                                                    <span className="text-sm truncate text-slate-700">{file.name}</span>
                                                    <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                    onClick={() => removeFile(idx)}
                                                >
                                                    <div className="h-4 w-4">×</div>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="px-6"
                                    onClick={() => navigate('/admin/tickets')}
                                    disabled={createMutation.isPending || isUploading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || !descripcion.trim() || isUploading}
                                    className="bg-blue-600 hover:bg-blue-700 px-8 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                    {(createMutation.isPending || isUploading) ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isUploading ? 'Subiendo archivos...' : 'Creando Ticket...'}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Crear Ticket
                                        </>
                                    )}
                                </Button>
                            </div>

                            {createMutation.isError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-3 animate-in shake">
                                    <div className="bg-red-100 p-2 rounded-full">⚠️</div>
                                    <div>
                                        <p className="font-bold">Error al crear el ticket</p>
                                        <p className="text-sm text-red-600">{(createMutation.error as any).message}</p>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCreateTicket;
