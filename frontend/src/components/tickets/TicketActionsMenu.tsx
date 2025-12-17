import { useState } from 'react';
import { ticketsService } from '@/api/tickets.service';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, PlayCircle, CheckCircle, XCircle, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/auth/auth.store';
import { useChatStore } from "@/store/chat.store";
import { Ticket } from '@/types/api.types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TicketActionsMenuProps {
    ticket: Ticket;
    onUpdate?: () => void;
}

export const TicketActionsMenu = ({ ticket, onUpdate }: TicketActionsMenuProps) => {
    const navigate = useNavigate()
    const { openChat } = useChatStore()
    const [isOpen, setIsOpen] = useState(false);
    const { user, hasPermission } = useAuthStore();

    // Debug ticket object
    console.log('TicketActionMenu received ticket:', ticket);

    // Check if user can change priority (based on permissions)
    const canChangePriority = hasPermission('TICKETS_UPDATE_PRIORITY') ||
        hasPermission('*') ||
        user?.rol === 'admin-general';

    const canDelete = user?.rol === 'admin-general' || user?.rol === 'admin-subroot';

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            await ticketsService.updateTicketStatus(ticket._id || ticket.id!, newStatus);
            toast.success('Estado actualizado correctamente');
            onUpdate?.();
            setIsOpen(false);
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.msg || error.message}`);
        }
    };

    const handleUpdatePriority = async (newPriority: string) => {
        try {
            await ticketsService.updateTicketPriority(ticket._id || ticket.id!, newPriority);
            toast.success(`Prioridad actualizada a: ${newPriority}`);
            onUpdate?.();
            setIsOpen(false);
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.msg || error.message}`);
        }
    };

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const handleDelete = async () => {
        try {
            await ticketsService.deleteTicket(ticket._id || ticket.id!);
            toast.success('Ticket eliminado correctamente');
            onUpdate?.();
            setIsDeleteAlertOpen(false);
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.msg || error.message}`);
        }
    };

    const handleViewDetails = () => {
        const ticketId = ticket._id || ticket.id;
        if (ticketId) {
            navigate(`/admin/tickets/${ticketId}`);
        } else {
            console.error('Ticket ID missing:', ticket);
            toast.error('Error: No se pudo identificar el ticket');
        }
        setIsOpen(false);
    };

    return (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Ver Detalles */}
                    <DropdownMenuItem onClick={handleViewDetails}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openChat(ticket._id || ticket.id, ticket.titulo || 'Ticket')}>
                        Abrir Chat (Flotante)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar Estado</DropdownMenuLabel>

                    {/* Cambiar Estado */}
                    <DropdownMenuItem onClick={() => handleUpdateStatus('en_proceso')}>
                        <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                        En Proceso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus('en_espera')}>
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        En Espera (Pausa SLA)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus('resuelto')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Resuelto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus('cerrado')}>
                        <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                        Cerrado
                    </DropdownMenuItem>

                    {/* Cambiar Prioridad - Solo con permisos */}
                    {canChangePriority ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar Prioridad</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => handleUpdatePriority('baja')}>
                                Prioridad: Baja
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePriority('media')}>
                                Prioridad: Media
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePriority('alta')}>
                                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                                Prioridad: Alta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdatePriority('crítica')}>
                                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                                Prioridad: Crítica
                            </DropdownMenuItem>
                        </>
                    ) : null}

                    {/* Eliminar - Solo Admins */}
                    {canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setIsDeleteAlertOpen(true);
                                    setIsOpen(false);
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Ticket
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el ticket
                        <span className="font-bold"> {ticket.titulo} </span>
                        y todos sus mensajes asociados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
