import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@/types/api.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { TicketActionsMenu } from "@/components/tickets/TicketActionsMenu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ticketsService } from "@/api/tickets.service"
import { toast } from "sonner"

// Helper function to handle status changes
const handleStatusChange = async (ticket: any, newStatus: string, table: any) => {
    try {
        await ticketsService.updateTicketStatus(ticket._id || ticket.id, newStatus);
        toast.success(`Estado actualizado a: ${newStatus.replace(/_/g, ' ')}`);
        const onUpdate = table.options.meta?.onUpdate;
        if (onUpdate) onUpdate();
    } catch (error: any) {
        toast.error(error.response?.data?.msg || 'Error al actualizar el estado');
    }
};

// Helper function to handle priority changes
const handlePriorityChange = async (ticket: any, newPriority: string, table: any) => {
    try {
        await ticketsService.updateTicketPriority(ticket._id || ticket.id, newPriority);
        toast.success(`Prioridad actualizada a: ${newPriority.toUpperCase()}`);
        const onUpdate = table.options.meta?.onUpdate;
        if (onUpdate) onUpdate();
    } catch (error: any) {
        toast.error(error.response?.data?.msg || 'Error al actualizar la prioridad');
    }
};

export const columns: ColumnDef<Ticket>[] = [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-mono text-xs">{(row.original as any)._id?.slice(-6) || row.getValue("id")?.toString().slice(-6)}</span>,
    },
    {
        accessorKey: "titulo",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Asunto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row, table }) => {
            const statusRaw = row.getValue("estado") as string;
            const status = statusRaw?.toLowerCase() || '';
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";

            switch (status) {
                case 'abierto':
                    variant = "destructive";
                    break;
                case 'en_proceso':
                    variant = "default";
                    break;
                case 'en_espera':
                    variant = "secondary";
                    break;
                case 'resuelto':
                    variant = "secondary";
                    break;
                case 'cerrado':
                    variant = "outline";
                    break;
            }

            const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            // Define inline styles for each status
            let badgeStyle: React.CSSProperties = {};
            switch (status) {
                case 'abierto':
                    badgeStyle = { backgroundColor: '#dc2626', color: 'white' };
                    break;
                case 'en_proceso':
                    badgeStyle = { backgroundColor: '#2563eb', color: 'white' };
                    break;
                case 'en_espera':
                    badgeStyle = { backgroundColor: '#f59e0b', color: 'white' };
                    break;
                case 'resuelto':
                    badgeStyle = { backgroundColor: '#059669', color: 'white' };
                    break;
                case 'cerrado':
                    badgeStyle = { backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' };
                    break;
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Badge variant={variant} style={badgeStyle} className="cursor-pointer hover:opacity-80">
                            {displayText}
                        </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'abierto', table)}>
                            <Badge style={{ backgroundColor: '#dc2626', color: 'white' }} className="mr-2">🔴 Abierto</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'en_proceso', table)}>
                            <Badge style={{ backgroundColor: '#2563eb', color: 'white' }} className="mr-2">🔵 En Proceso</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'en_espera', table)}>
                            <Badge style={{ backgroundColor: '#f59e0b', color: 'white' }} className="mr-2">🟡 En Espera</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'resuelto', table)}>
                            <Badge style={{ backgroundColor: '#059669', color: 'white' }} className="mr-2">🟢 Resuelto</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(row.original, 'cerrado', table)}>
                            <Badge style={{ backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' }} className="mr-2">⚪ Cerrado</Badge>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
    {
        accessorKey: "prioridad",
        header: "Prioridad",
        cell: ({ row, table }) => {
            const priority = (row.getValue("prioridad") as string)?.toLowerCase() || 'media';

            // Define inline styles for each priority
            let priorityStyle: React.CSSProperties = {};
            switch (priority) {
                case 'critica':
                case 'crítica':
                    priorityStyle = { backgroundColor: '#e11d48', color: 'white' };
                    break;
                case 'alta':
                    priorityStyle = { backgroundColor: '#ea580c', color: 'white' };
                    break;
                case 'media':
                    priorityStyle = { backgroundColor: '#0ea5e9', color: 'white' };
                    break;
                case 'baja':
                    priorityStyle = { backgroundColor: '#14b8a6', color: 'white' };
                    break;
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Badge style={priorityStyle} className="cursor-pointer font-medium text-xs uppercase">
                            {priority}
                        </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Cambiar Prioridad</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePriorityChange(row.original, 'crítica', table)}>
                            <Badge style={{ backgroundColor: '#e11d48', color: 'white' }} className="mr-2">🔥 CRÍTICA</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange(row.original, 'alta', table)}>
                            <Badge style={{ backgroundColor: '#ea580c', color: 'white' }} className="mr-2">⚠️ ALTA</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange(row.original, 'media', table)}>
                            <Badge style={{ backgroundColor: '#0ea5e9', color: 'white' }} className="mr-2">📋 MEDIA</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePriorityChange(row.original, 'baja', table)}>
                            <Badge style={{ backgroundColor: '#14b8a6', color: 'white' }} className="mr-2">✅ BAJA</Badge>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    },
    {
        accessorKey: "usuarioCreador",
        header: "Creado por",
        cell: ({ row }) => {
            const creator = row.getValue("usuarioCreador") as any;
            const displayName = creator?.nombre || creator?.correo || (typeof creator === 'string' ? creator.slice(-6) : 'N/A');
            return <span className="text-xs text-slate-600">{displayName}</span>
        }
    },
    {
        accessorKey: "agenteAsignado",
        header: "Asignado a",
        cell: ({ row }) => {
            const assignee = row.getValue("agenteAsignado") as any;
            if (!assignee) {
                return <Badge variant="outline" className="text-xs">Sin asignar</Badge>
            }
            const displayName = assignee?.nombre || assignee?.correo || (typeof assignee === 'string' ? assignee.slice(-6) : 'N/A');
            return <span className="text-xs text-blue-600 font-medium">{displayName}</span>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Creado el",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium">{date.toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "fechaLimiteResolucion",
        header: "Vencimiento (SLA)",
        cell: ({ row }) => {
            let date: Date | null = null;
            const limitDateStr = row.getValue("fechaLimiteResolucion") as string;

            if (limitDateStr) {
                date = new Date(limitDateStr);
            } else {
                const createdAt = new Date(row.getValue("createdAt"));
                const priority = (row.getValue("prioridad") as string)?.toUpperCase();

                let hoursToAdd = 48;
                if (priority === 'CRITICA' || priority === 'CRÍTICA') hoursToAdd = 4;
                else if (priority === 'ALTA') hoursToAdd = 24;
                else if (priority === 'BAJA') hoursToAdd = 168;

                date = new Date(createdAt.getTime() + hoursToAdd * 60 * 60 * 1000);
            }

            if (!date || isNaN(date.getTime())) {
                return <span className="text-xs text-slate-400">-</span>;
            }

            const isOverdue = date < new Date() && row.getValue("estado")?.toString().toLowerCase() !== 'resuelto' && row.getValue("estado")?.toString().toLowerCase() !== 'cerrado';

            return (
                <div className="flex flex-col">
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                        {date.toLocaleDateString()} {isOverdue ? '(Vencido)' : ''}
                    </span>
                    <span className="text-[10px] text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const ticket = row.original;
            // @ts-ignore
            const onUpdate = table.options.meta?.onUpdate;

            return (
                <TicketActionsMenu
                    ticket={ticket}
                    onUpdate={onUpdate || (() => { })}
                />
            );
        },
    },
]
