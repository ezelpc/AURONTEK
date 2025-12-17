import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { useAuthStore } from '@/auth/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Clock, User, Building, Paperclip, MessageSquare } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { TicketActionsMenu } from '@/components/tickets/TicketActionsMenu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TicketDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [showChat, setShowChat] = useState(false);

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
        switch (s) {
            case 'abierto': return <Badge variant="destructive" className="uppercase">Abierto</Badge>;
            case 'en_proceso': return <Badge className="bg-blue-600 hover:bg-blue-700 uppercase">En Proceso</Badge>;
            case 'en_espera': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white uppercase">En Espera</Badge>;
            case 'resuelto': return <Badge className="bg-green-600 hover:bg-green-700 uppercase">Resuelto</Badge>;
            case 'cerrado': return <Badge variant="outline" className="text-slate-500 uppercase">Cerrado</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Helper for Priority
    const getPriorityColor = (p: string) => {
        const priority = p?.toLowerCase();
        if (priority === 'crítica' || priority === 'urgente') return 'text-red-600 bg-red-50 border-red-200';
        if (priority === 'alta') return 'text-orange-600 bg-orange-50 border-orange-200';
        if (priority === 'baja') return 'text-green-600 bg-green-50 border-green-200';
        return 'text-blue-600 bg-blue-50 border-blue-200'; // Media
    };

    // Chat Logic
    // Habilitado si: 'en_proceso' o 'resuelto'.
    // Lectura si: 'cerrado' o 'abierto' (aunque abierto podría no tener chat aun).
    // Usuario dice: "se deshabilita cuando se cierra" -> Cerrado = Disabled.
    const isChatEnabled = ['en_proceso', 'resuelto'].includes(ticket.estado?.toLowerCase());

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
                <Button variant="ghost" onClick={() => navigate('/admin/tickets')} className="text-slate-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Tickets
                </Button>
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
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant="outline" className="font-mono text-xs">#{ticket._id?.slice(-6)}</Badge>
                                        {getStatusBadge(ticket.estado)}
                                        <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${getPriorityColor(ticket.prioridad)}`}>
                                            {ticket.prioridad}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl text-slate-800">{ticket.titulo}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Clock className="h-3 w-3" />
                                        Creado el {format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-6">
                            {/* Descripción */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Descripción</h3>
                                <div className="bg-slate-50 p-4 rounded-md text-slate-700 whitespace-pre-wrap leading-relaxed border">
                                    {ticket.descripcion}
                                </div>
                            </div>

                            {/* Imágenes Adjuntas */}
                            {ticket.imagenes && ticket.imagenes.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Imágenes Adjuntas</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {ticket.imagenes.map((imagen: string, index: number) => {
                                            // Transform URL to use gateway if it's a local upload
                                            const imageUrl = imagen.startsWith('/uploads')
                                                ? `${import.meta.env.VITE_API_URL}${imagen}`
                                                : imagen;

                                            return (
                                                <a
                                                    key={index}
                                                    href={imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all cursor-pointer"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Adjunto ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1 rounded-full text-xs font-medium">
                                                            Ver imagen
                                                        </div>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Info General Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 border rounded-md">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <User className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase">Solicitante</span>
                                    </div>
                                    <div className="font-medium text-slate-800">
                                        {(ticket.usuarioCreador as any)?.nombre || 'Usuario Desconocido'}
                                    </div>
                                    <div className="text-xs text-slate-500">{(ticket.usuarioCreador as any)?.email}</div>
                                </div>

                                <div className="p-3 border rounded-md">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Building className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase">Empresa / Área</span>
                                    </div>
                                    <div className="font-medium text-slate-800">
                                        {(ticket.empresaId as any)?.nombre || 'Interno'}
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase">{ticket.categoria || 'General'}</div>
                                </div>

                                <div className="p-3 border rounded-md">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <User className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-bold uppercase">Asignado A</span>
                                    </div>
                                    {ticket.agenteAsignado ? (
                                        <>
                                            <div className="font-medium text-blue-700">
                                                {(ticket.agenteAsignado as any).nombre}
                                            </div>
                                            <div className="text-xs text-slate-500">{(ticket.agenteAsignado as any).rol}</div>
                                        </>
                                    ) : (
                                        <div className="text-slate-400 italic text-sm">Sin asignar</div>
                                    )}
                                </div>
                                <div className="p-3 border rounded-md">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Clock className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs font-bold uppercase">SLA / Tiempos</span>
                                    </div>
                                    <div className="text-sm">
                                        {ticket.tiempoEnEspera ? (
                                            <div className="text-yellow-600">⏸️ Pausado: {(ticket.tiempoEnEspera / 1000 / 60).toFixed(0)} min</div>
                                        ) : null}
                                        {/* Poner más info de SLA aquí si existe */}
                                        <div className="text-xs text-slate-400 mt-1">Servicio: {ticket.servicioNombre}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Adjuntos */}
                            {ticket.adjuntos && ticket.adjuntos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" /> Evidencias Adjuntas
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ticket.adjuntos.map((file: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center p-3 border rounded hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="bg-slate-100 p-2 rounded mr-3 group-hover:bg-white text-xs font-bold text-slate-600">
                                                    {file.tipo?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-sm font-medium truncate text-blue-600">{file.nombre}</div>
                                                </div>
                                            </a>
                                        ))}
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
        </div>
    );
};

export default TicketDetail;
