import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Clock, User, Building, MessageSquare, X, Image as ImageIcon, FileText } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { TicketActionsMenu } from '@/components/tickets/TicketActionsMenu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TicketDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const queryClient = useQueryClient();
    const [showChat, setShowChat] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch Ticket Data
    const { data: ticket, isLoading, isError, refetch } = useQuery({
        queryKey: ['ticket', id],
        queryFn: () => ticketsService.getTicketById(id!),
        enabled: !!id,
        refetchInterval: 30000 // Refresh every 30s to see status changes?
    });

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Cargando detalles del ticket...</div>;
    }

    if (isError || !ticket) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 mb-2 font-bold">Error al cargar ticket</div>
                <div className="text-sm text-slate-500 mb-4">{(isError && (ticket as any)?.message) || (ticket as any)?.error || 'No se pudo obtener la información'}</div>
                {/* Debug info */}
                <div className="text-xs text-slate-400 mb-4 font-mono bg-slate-100 p-2 rounded">
                    ID: {id} <br />
                    Error: {JSON.stringify(isError)}
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/tickets')}>Volver</Button>
            </div>
        );
    }

    // Helper for Status Badge
    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase();
        const baseClass = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border";
        switch (s) {
            case 'abierto': return <span className={cn(baseClass, "bg-red-50 text-red-600 border-red-200")}>Abierto</span>;
            case 'en_proceso': return <span className={cn(baseClass, "bg-blue-50 text-blue-600 border-blue-200 animate-pulse")}>En Proceso</span>;
            case 'en_espera': return <span className={cn(baseClass, "bg-amber-50 text-amber-600 border-amber-200")}>En Espera</span>;
            case 'resuelto': return <span className={cn(baseClass, "bg-emerald-50 text-emerald-600 border-emerald-200")}>Resuelto</span>;
            case 'cerrado': return <span className={cn(baseClass, "bg-slate-50 text-slate-500 border-slate-200")}>Cerrado</span>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Helper for Priority
    const getPriorityStyles = (p: string) => {
        const priority = p?.toLowerCase();
        if (priority === 'crítica' || priority === 'urgente' || priority === 'critica')
            return 'text-red-600 bg-red-50/50 border-red-200';
        if (priority === 'alta')
            return 'text-orange-600 bg-orange-50/50 border-orange-200';
        if (priority === 'baja')
            return 'text-emerald-600 bg-emerald-50/50 border-emerald-200';
        return 'text-indigo-600 bg-indigo-50/50 border-indigo-200'; // Media
    };


    // Chat Logic
    // Habilitado si: 'en_proceso' o 'resuelto'.
    // Lectura si: 'cerrado' o 'abierto' (aunque abierto podría no tener chat aun).
    // Usuario dice: "se deshabilita cuando se cierra" -> Cerrado = Disabled.
    const isChatEnabled = ['en_proceso', 'resuelto'].includes(ticket.estado?.toLowerCase());

    // Determine context (admin vs company)
    const isCompanyPortal = location.pathname.includes('/empresa');

    // Auto-open chat if enabled? Or waiting for user click?
    // "te de la opcion de abrir chat" -> User click.

    const handleUpdate = () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
    };

    return (
        <div className="max-w-7xl mx-auto pb-10 space-y-6 animate-in fade-in duration-500">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate(isCompanyPortal ? '/empresa/dashboard' : '/admin/tickets')}
                    className="text-slate-600"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {isCompanyPortal ? 'Volver al Dashboard' : 'Volver a Tickets'}
                </Button>

                {/* Show Actions Menu (Items filtered by permissions inside) */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 mr-2">Acciones:</span>
                    <TicketActionsMenu ticket={ticket} onUpdate={handleUpdate} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Info Ticket */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border rounded shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Ticket</span>
                                            <span className="font-mono text-xs font-bold text-slate-700">#{ticket._id?.slice(-6)}</span>
                                        </div>
                                        {getStatusBadge(ticket.estado)}
                                        <span className={cn("text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wider shadow-sm", getPriorityStyles(ticket.prioridad))}>
                                            {ticket.prioridad}
                                        </span>
                                    </div>
                                    <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{ticket.titulo}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-2 font-medium text-slate-500">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        Iniciado el {format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                    </CardDescription>
                                </div>

                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-6">
                            {/* Descripción */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Descripción del Caso</h3>
                                </div>
                                <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed border shadow-inner text-base">
                                    {ticket.descripcion}
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</span>
                                    </div>
                                    <div className="font-bold text-slate-900 truncate">
                                        {(ticket.usuarioCreador as any)?.nombre || 'Usuario'}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate mt-0.5">{(ticket.usuarioCreador as any)?.email}</div>
                                </div>

                                <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Building className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa / Área</span>
                                    </div>
                                    <div className="font-bold text-slate-900 truncate">
                                        {(ticket.empresaId as any)?.nombre || 'Interno'}
                                    </div>
                                    <Badge variant="outline" className="mt-1 text-[9px] uppercase font-bold text-indigo-600 border-indigo-100 bg-indigo-50/30">
                                        {ticket.categoria || 'Soporte General'}
                                    </Badge>
                                </div>

                                <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow group border-l-4 border-l-blue-500">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente Asignado</span>
                                    </div>
                                    {ticket.agenteAsignado ? (
                                        <>
                                            <div className="font-bold text-blue-700 truncate">
                                                {(ticket.agenteAsignado as any).nombre}
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">{(ticket.agenteAsignado as any).rol}</div>
                                        </>
                                    ) : (
                                        <div className="text-slate-400 italic text-sm mt-1">Esperando asignación...</div>
                                    )}
                                </div>

                                <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información SLA</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-slate-700 truncate">{ticket.servicioNombre}</div>
                                        {ticket.tiempoEnEspera ? (
                                            <div className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center font-bold">
                                                ⏸️ {(ticket.tiempoEnEspera / 1000 / 60).toFixed(0)} min pausa
                                            </div>
                                        ) : (
                                            <div className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center font-bold">
                                                ✅ Dentro de tiempo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Unified Evidence Gallery */}
                            {((ticket.imagenes && ticket.imagenes.length > 0) || (ticket.adjuntos && ticket.adjuntos.length > 0)) && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-6 bg-indigo-600 rounded-full"></div>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Evidencias y Adjuntos</h3>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium font-mono">
                                            {((ticket.imagenes?.length || 0) + (ticket.adjuntos?.length || 0))} archivos detectados
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {/* Render legacy images array */}
                                        {ticket.imagenes?.map((imagen: string, index: number) => {
                                            let imageUrl = imagen;
                                            if (imagen.startsWith('/uploads')) {
                                                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
                                                imageUrl = `${baseUrl}${imagen}`;
                                            }
                                            return (
                                                <div
                                                    key={`img-${index}`}
                                                    onClick={() => setSelectedImage(imageUrl)}
                                                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer bg-slate-50"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt="Evidencia"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="bg-white/95 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                            <ImageIcon className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Render dynamic adjuntos array */}
                                        {ticket.adjuntos?.map((file: any, index: number) => {
                                            const isImage = file.tipo?.startsWith('image/');
                                            let fileUrl = file.url;
                                            if (file.url.startsWith('/uploads')) {
                                                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
                                                fileUrl = `${baseUrl}${file.url}`;
                                            }

                                            return isImage ? (
                                                <div
                                                    key={`adj-${index}`}
                                                    onClick={() => setSelectedImage(fileUrl)}
                                                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer bg-slate-50"
                                                >
                                                    <img
                                                        src={fileUrl}
                                                        alt={file.nombre}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                        <p className="text-[9px] text-white truncate font-medium">{file.nombre}</p>
                                                    </div>
                                                    <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="bg-white/95 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                            <ImageIcon className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <a
                                                    key={`adj-${index}`}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex flex-col justify-center items-center aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group p-4 text-center"
                                                >
                                                    <div className="bg-slate-100 p-3 rounded-2xl mb-2 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                                                        <FileText className="h-6 w-6 text-slate-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-600 line-clamp-2 uppercase h-7 overflow-hidden leading-tight">
                                                        {file.nombre}
                                                    </p>
                                                    <span className="text-[8px] mt-1 font-mono text-slate-400 group-hover:text-blue-500">
                                                        {file.tipo?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Chat & Actions */}
                <div className="space-y-6">

                    {/* Chat Section */}
                    {/* Botón para abrir chat si está "colapsado" en móvil o si queremos control manual */}
                    {!showChat ? (
                        <Card className="bg-blue-50 border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setShowChat(true)}>
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="bg-blue-100 p-4 rounded-full mb-3 text-blue-600">
                                    <MessageSquare className="h-8 w-8" />
                                </div>
                                <h3 className="font-bold text-blue-900 text-lg">Chat del Ticket</h3>
                                <p className="text-sm text-blue-700/80 mb-4">
                                    {isChatEnabled
                                        ? "Comunícate directamente con el solicitante/agente."
                                        : "Historial de conversación (Solo lectura)."
                                    }
                                </p>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    {isChatEnabled ? 'Abrir Chat' : 'Ver Historial'}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        // Chat Component
                        <div className="animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h3 className="font-bold text-slate-700">Conversación</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)} className="h-6 text-xs text-slate-500">
                                    Ocultar
                                </Button>
                            </div>
                            <ChatWindow ticketId={id!} disabled={!isChatEnabled} />
                        </div>
                    )}

                    {/* Historial de Cambios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Historial de Cambios
                            </CardTitle>
                            <CardDescription>
                                Registro completo de todas las modificaciones realizadas al ticket
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TicketTimeline ticketId={id!} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Preview Modal */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl w-full p-0">
                    <DialogHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle>Vista Previa de Imagen</DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedImage(null)}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="p-4">
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Vista previa"
                                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TicketDetail;
