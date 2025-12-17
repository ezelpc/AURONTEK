import { useQuery } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, AlertCircle, CheckCircle, Edit, ArrowRight, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TicketHistoryEntry {
    _id: string;
    ticketId: string;
    tipo: 'status_change' | 'assignment' | 'priority_change' | 'comment' | 'update';
    usuario: { nombre: string; correo: string };
    cambios: {
        campo: string;
        valorAnterior: any;
        valorNuevo: any;
    }[];
    comentario?: string;
    createdAt: string;
}

const TimelineEntry = ({ entry }: { entry: TicketHistoryEntry }) => {
    const getIcon = () => {
        switch (entry.tipo) {
            case 'status_change':
                return <CheckCircle className="h-5 w-5 text-blue-500" />;
            case 'assignment':
                return <User className="h-5 w-5 text-green-500" />;
            case 'priority_change':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            case 'comment':
                return <MessageSquare className="h-5 w-5 text-purple-500" />;
            default:
                return <Edit className="h-5 w-5 text-slate-500" />;
        }
    };

    const getChangeDescription = () => {
        if (entry.tipo === 'comment') {
            return <p className="text-sm text-slate-600 italic">"{entry.comentario}"</p>;
        }

        return entry.cambios.map((cambio, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-700">{cambio.campo}:</span>
                <Badge variant="outline" className="text-xs">{cambio.valorAnterior || 'N/A'}</Badge>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <Badge variant="default" className="text-xs">{cambio.valorNuevo}</Badge>
            </div>
        ));
    };

    return (
        <div className="flex gap-4 pb-4 border-l-2 border-slate-200 pl-4 ml-2 relative">
            <div className="absolute -left-[13px] top-0 bg-white p-1 rounded-full border-2 border-slate-200">
                {getIcon()}
            </div>
            <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{entry.usuario.nombre}</span>
                        <span className="text-xs text-slate-500">{entry.usuario.correo}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                        {format(new Date(entry.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                </div>
                <div className="space-y-1">
                    {getChangeDescription()}
                </div>
            </div>
        </div>
    );
};

export const TicketTimeline = ({ ticketId }: { ticketId: string }) => {
    const { data: history, isLoading } = useQuery({
        queryKey: ['ticket-history', ticketId],
        queryFn: () => ticketsService.getTicketHistory(ticketId),
        enabled: !!ticketId
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 pb-4">
                        <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
                            <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No hay cambios registrados aún</p>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {history.map((entry) => (
                <TimelineEntry key={entry._id} entry={entry} />
            ))}
        </div>
    );
};
