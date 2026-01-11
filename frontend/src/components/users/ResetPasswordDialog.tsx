import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { userService } from '@/api/user.service';
import { KeyRound, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResetPasswordDialogProps {
    userId: string;
    userName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ userId, userName, open, onOpenChange }: ResetPasswordDialogProps) {
    const [loading, setLoading] = useState(false);

    // We assume usersService is in '@/api/users.service.ts' or similar. 
    // Wait, I haven't added recoverPassword to usersService yet!
    // I need to update usersService first.

    const handleReset = async () => {
        setLoading(true);
        try {
            // Dynamic import service if needed or assume it's there
            // Calling API directly if service not updated yet? Better update service.
            // For now: 
            await userService.recoverPassword(userId);

            toast.success(`Contraseña de ${userName} restablecida.`);
            toast.info(`Se ha enviado un correo a ${userName} con la nueva contraseña.`);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Error al restablecer contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-orange-500" />
                        Restablecer Contraseña
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción generará una nueva contraseña temporal para <strong>{userName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
                        <Mail className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-xs">
                            Se enviará un correo electrónico al usuario con la contraseña temporal generada.
                            El usuario deberá cambiarla en su próximo inicio de sesión.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleReset} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Confirmar Restablecimiento'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
