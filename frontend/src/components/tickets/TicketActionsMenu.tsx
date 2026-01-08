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
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface TicketActionsMenuProps {
    ticket: Ticket;
    onUpdate?: () => void;
}

export const TicketActionsMenu = ({ ticket, onUpdate }: TicketActionsMenuProps) => {
    const navigate = useNavigate()
    const { openChat } = useChatStore()
    const [isOpen, setIsOpen] = useState(false);
    const { user, hasPermission } = useAuthStore();

    // Check permissions strictly (Granular RBAC)
    const canDelete = hasPermission('tickets.delete');
    const canChangeStatus = hasPermission('tickets.change_status');

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

    const [isMotiveDialogOpen, setIsMotiveDialogOpen] = useState(false);
    const [motive, setMotive] = useState('');
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    const handleStatusChange = async (status: string) => {
        if (status === 'en_espera') {
            setPendingStatus(status);
            setMotive('');
            setIsMotiveDialogOpen(true);
            setIsOpen(false);
            return;
        }

        await updateStatus(status);
    };

    const confirmStatusChange = async () => {
        if (!motive.trim()) {
            toast.error('El motivo es obligatorio para poner el ticket en espera');
            return;
        }
        if (pendingStatus) {
            await updateStatus(pendingStatus, motive);
            setIsMotiveDialogOpen(false);
        }
    };

    const updateStatus = async (status: string, motivo?: string) => {
        try {
            // Se asume que ticketsService.updateTicketStatus soporta motivo (necesitamos actualizar service frontend)
            // O usamos ticketsService.updateTicket si updateTicketStatus no lo soporta
            // Revisando ticketsService.updateTicketStatus: solo recibe id y estado.
            // Actualizaremos el servicio frontend.
            await ticketsService.updateTicketStatus(ticket._id || ticket.id!, status, motivo);
            toast.success(`Estado actualizado a ${status.replace('_', ' ')}`);
            onUpdate?.();
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.msg || error.message}`);
        }
    };


    return (
        <>
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

                        <DropdownMenuItem onClick={handleViewDetails}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => openChat(ticket._id || ticket.id, ticket.titulo || 'Ticket')}>
                            Abrir Chat (Flotante)
                        </DropdownMenuItem>

                        {canChangeStatus && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleStatusChange('en_proceso')}>En Proceso</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('en_espera')}>En Espera</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange('resuelto')}>Resuelto</DropdownMenuItem>
                            </>
                        )}

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

            {/* Modal para Motivo de Espera */}
            <Dialog open={isMotiveDialogOpen} onOpenChange={setIsMotiveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motivo de Pausa</DialogTitle>
                        <DialogDescription>
                            Por favor indica por qué se pone este ticket en espera. Esto pausará el SLA.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full p-2 border rounded-md bg-white dark:bg-slate-900 text-black dark:text-white border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                            placeholder="Ej: Esperando respuesta del cliente, Esperando repuesto..."
                            value={motive}
                            onChange={(e) => setMotive(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMotiveDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmStatusChange} disabled={!motive.trim()}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
