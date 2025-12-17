import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { User, FileText, LayoutDashboard, Settings } from 'lucide-react';
// import { Dialog, DialogContent } from '@/components/ui/dialog'; // Shadcn wrapping cmdk? Or just using cmdk primitives styled?
// CMDK is headless. I need to style it. Usually Shadcn has a "Command" component wrapping it.
// I'll create a simple styled wrapper inline or use a separate file if I had the full shadcn registry.
// For simplicity, I will implement a custom styled version here.

// Estilos básicos simulando Shadcn Command
const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // Toggle con Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <Command className="w-full">
                    <div className="flex items-center border-b border-slate-100 px-3 dark:border-slate-800">
                        <Command.Input
                            placeholder="Buscar comando o ticket..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400"
                        />
                    </div>
                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500">
                            Sin resultados.
                        </Command.Empty>

                        <Command.Group heading="Navegación" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
                                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 cursor-pointer"
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/admin/tickets'))}
                                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 cursor-pointer"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Tickets</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/admin/usuarios'))}
                                className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 cursor-pointer"
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>Usuarios</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Acciones" className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Command.Item className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configuración (Próximamente)</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
};

export default CommandMenu;
