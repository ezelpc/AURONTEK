import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@/types/api.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { TicketActionsMenu } from "@/components/tickets/TicketActionsMenu"

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
        cell: ({ row }) => {
            const statusRaw = row.getValue("estado") as string;
            const status = statusRaw?.toLowerCase() || '';
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
            let className = "";

            switch (status) {
                case 'abierto': variant = "destructive"; break;
                case 'en_proceso': variant = "default"; className = "bg-blue-600 hover:bg-blue-700"; break;
                case 'en_espera': variant = "secondary"; className = "bg-yellow-500 hover:bg-yellow-600 text-white"; break;
                case 'resuelto': variant = "secondary"; className = "bg-green-600 hover:bg-green-700 text-white"; break;
                case 'cerrado': variant = "outline"; break;
            }

            // Format text: en_proceso -> En Proceso
            const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            return <Badge variant={variant} className={className}>{displayText}</Badge>
        },
    },
    {
        accessorKey: "prioridad",
        header: "Prioridad",
        cell: ({ row }) => {
            return <span className="font-medium text-xs uppercase">{row.getValue("prioridad")}</span>
        }
    },
    {
        accessorKey: "usuarioCreador",
        header: "Creado por",
        cell: ({ row }) => {
            const creator = row.getValue("usuarioCreador") as any;
            // If it's an object with nombre, show it; otherwise show the ID
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
                // Calculate based on SLA if backend doesn't provide it
                const createdAt = new Date(row.getValue("createdAt"));
                const priority = (row.getValue("prioridad") as string)?.toUpperCase();

                // Add hours based on priority
                let hoursToAdd = 48; // Default MEDIA
                if (priority === 'CRITICA' || priority === 'CRÍTICA') hoursToAdd = 4;
                else if (priority === 'ALTA') hoursToAdd = 24;
                else if (priority === 'BAJA') hoursToAdd = 168; // 1 week

                date = new Date(createdAt.getTime() + hoursToAdd * 60 * 60 * 1000);
            }

            // If date is still null (e.g., createdAt was invalid), return a placeholder
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
            // @ts-ignore - table.options.meta is available
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
