import { useState, useEffect } from 'react';
import { ticketsService } from '@/api/tickets.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/api/axios';

interface DelegateDialogProps {
    ticketId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Becario {
    _id: string;
    nombre: string;
    email: string;
}

export const DelegateDialog = ({ ticketId, isOpen, onClose, onSuccess }: DelegateDialogProps) => {
    const [becarios, setBecarios] = useState<Becario[]>([]);
    const [selectedBecario, setSelectedBecario] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadBecarios();
        }
    }, [isOpen]);

    const loadBecarios = async () => {
        try {
            // Obtener usuarios con rol becario
            const response = await api.get('/usuarios', {
                params: { activo: true }
            });

            let usuarios = response.data;
            if (usuarios && typeof usuarios === 'object' && !Array.isArray(usuarios)) {
                usuarios = usuarios.usuarios || usuarios.data || [];
            }

            // Filtrar becarios
            const becariosList = usuarios.filter((u: any) =>
                u.rol === 'becario' || u.rol === 'beca-soporte'
            );

            setBecarios(becariosList);
        } catch (error) {
            console.error('Error cargando becarios:', error);
            toast.error('Error al cargar lista de becarios');
        }
    };

    const handleDelegate = async () => {
        if (!selectedBecario) {
            toast.error('Debes seleccionar un becario');
            return;
        }

        setIsLoading(true);
        try {
            await ticketsService.delegateTicket(ticketId, selectedBecario);
            toast.success('Ticket delegado exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(`Error: ${error.response?.data?.msg || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delegar Ticket a Becario</DialogTitle>
                    <DialogDescription>
                        Selecciona un becario para delegarle este ticket. Te convertirás en tutor del ticket.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="becario">Becario</Label>
                        <Select value={selectedBecario} onValueChange={setSelectedBecario}>
                            <SelectTrigger id="becario">
                                <SelectValue placeholder="Selecciona un becario" />
                            </SelectTrigger>
                            <SelectContent>
                                {becarios.map((becario) => (
                                    <SelectItem key={becario._id} value={becario._id}>
                                        {becario.nombre} ({becario.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {becarios.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No hay becarios disponibles
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDelegate}
                        disabled={!selectedBecario || isLoading || becarios.length === 0}
                    >
                        {isLoading ? 'Delegando...' : 'Delegar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
