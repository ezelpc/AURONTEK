import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Minimize2, Maximize2, Paperclip, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/auth/auth.store';
import { socketService } from '@/api/socket.service';
import { chatService, Message } from '@/api/chat.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ticketsService } from '@/api/tickets.service';

interface ChatWindowProps {
    ticketId: string;
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
    style?: React.CSSProperties;
    positionIndex: number;
}

export const ChatWindow = ({ ticketId, onClose, onMinimize, isMinimized, style, positionIndex }: ChatWindowProps) => {
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    // Fetch Ticket Info for Header
    const { data: ticket } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => ticketsService.getTickets({ limit: 1000 }).then(res => res.find(t => t._id === ticketId)), // Optimized in real app to getById
        staleTime: 5 * 60 * 1000
    });

    // Fetch Messages
    const { data: messages = [], isLoading, error } = useQuery({
        queryKey: ['chat', ticketId],
        queryFn: async () => chatService.getHistory(ticketId),
        retry: 1
    });

    // Auto-scroll
    useEffect(() => {
        if (!isMinimized && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isMinimized]);

    const handleSend = () => {
        if (!message.trim() || !ticketId) return;

        // Get empresaId from ticket (for Admin validation)
        const empresaId = typeof ticket?.empresaId === 'object'
            ? (ticket.empresaId as any)._id
            : ticket?.empresaId;

        socketService.sendMessage({
            ticketId,
            contenido: message.trim(),
            empresaId: empresaId,
            tipo: 'texto'
        });

        setMessage('');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
            toast.error('Cloudinary no configurado (Falta VITE_CLOUDINARY_CLOUD_NAME)');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aurontek_users');
        formData.append('folder', 'usuarios'); // Use 'usuarios' folder as in UserForm

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Cloudinary Error Detail:', errorData);
                throw new Error(errorData.error?.message || 'Error subiendo imagen');
            }

            const data = await response.json();

            // Get empresaId logic
            const empresaId = typeof ticket?.empresaId === 'object'
                ? (ticket.empresaId as any)._id
                : ticket?.empresaId;

            socketService.sendMessage({
                ticketId,
                contenido: data.secure_url,
                tipo: 'imagen',
                empresaId
            });

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error al subir imagen');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Header Title Logic
    const getHeaderTitle = () => {
        if (!ticket) return 'Cargando...';
        const isAssignedToMe = (ticket.agenteAsignado as any)?._id === user?.id || ticket.agenteAsignado === user?.id;
        const displayedName = isAssignedToMe
            ? (typeof ticket.usuarioCreador === 'object' ? (ticket.usuarioCreador as any)?.nombre : 'Usuario')
            : (typeof ticket.agenteAsignado === 'object' ? (ticket.agenteAsignado as any)?.nombre : 'Pendiente');
        return `${ticket.titulo} • ${displayedName}`;
    };

    if (!user) return null;

    if (isMinimized) {
        return (
            <div style={style} className="w-[200px] pointer-events-auto">
                <Button
                    variant="default"
                    className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-t-lg rounded-b-none"
                    onClick={onMinimize}
                >
                    <span className="truncate text-xs font-semibold mr-2">{getHeaderTitle()}</span>
                    <Maximize2 className="h-3 w-3 shrink-0" />
                </Button>
            </div>
        );
    }

    return (
        <Card style={style} className="w-[320px] h-[450px] shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-200">
            {/* Header */}
            <CardHeader className="p-3 border-b bg-blue-600 text-white shrink-0 flex flex-row items-center justify-between rounded-t-lg">
                <CardTitle className="text-sm font-semibold truncate leading-none flex-1 mr-2">
                    {getHeaderTitle()}
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-700 text-white" onClick={onMinimize}>
                        <Minimize2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-700 text-white" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="flex-1 p-0 overflow-hidden bg-white dark:bg-slate-950 flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-5 w-5 text-blue-500" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <AlertCircle className="h-6 w-6 text-red-500 opacity-50 mb-2" />
                            <p className="text-xs text-red-500">Error cargando chat</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 mt-8">Inicio de la conversación.</div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = (msg.emisorId && typeof msg.emisorId === 'object')
                                ? (msg.emisorId as any)._id === user?.id
                                : msg.emisorId === user?.id;

                            return (
                                <div key={msg._id} className={cn("flex flex-col mb-2", isOwn ? "items-end" : "items-start")}>
                                    {/* Message Bubble */}
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words shadow-sm",
                                        isOwn
                                            ? "bg-blue-600 text-white rounded-br-sm"
                                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                                    )}>
                                        {msg.tipo === 'imagen' ? (
                                            <div className="rounded-lg overflow-hidden">
                                                <a href={msg.contenido} target="_blank" rel="noopener noreferrer">
                                                    <img src={msg.contenido} alt="Adjunto" className="max-w-full h-auto object-cover hover:opacity-90 transition-opacity" />
                                                </a>
                                            </div>
                                        ) : (
                                            msg.contenido
                                        )}
                                    </div>
                                    <span className={cn("text-[10px] text-slate-400 mt-0.5 px-1", isOwn ? "text-right" : "text-left")}>
                                        {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                                    </span>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 border-t bg-white dark:bg-slate-950 flex gap-2 items-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-blue-500"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="min-h-[36px] text-sm resize-none"
                        placeholder="Mensaje..."
                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    />
                    <Button size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={!message.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
