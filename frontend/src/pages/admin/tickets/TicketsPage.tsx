import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/auth/auth.store';

const TicketsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticketFilter, setTicketFilter] = useState<'all' | 'created_by_me' | 'assigned' | 'internal' | 'platform'>('all');

    // Fetching real con React Query - cambia según el filtro
    const {
        data: tickets = [],
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['tickets', ticketFilter],
        queryFn: async () => {
            switch (ticketFilter) {
                case 'assigned':
                    return await ticketsService.getTickets({ asignado: true });
                case 'created_by_me':
                    // Assuming user ID is available in user object
                    return await ticketsService.getTickets({ usuarioCreador: user?.id || user?._id });
                case 'internal':
                    return await ticketsService.getInternalTickets();
                case 'platform':
                    return await ticketsService.getCompanyTickets();
                default:
                    return await ticketsService.getTickets();
            }
        },
        staleTime: 1000 * 60, // 1 minuto de caché
    });

    if (isError) {
        return (
            <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
                <p>Error al cargar tickets: {(error as any).message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tickets Globales</h2>
                    <p className="text-slate-500">Gestión centralizada de incidentes.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/admin/crear-ticket')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Ticket
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium">Filtrar por:</span>
                </div>
                <Select value={ticketFilter} onValueChange={(value: any) => setTicketFilter(value)}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Seleccionar filtro" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Tickets</SelectItem>
                        <SelectItem value="created_by_me">Mis Tickets Creados</SelectItem>
                        <SelectItem value="assigned">Asignados a Mí</SelectItem>
                        <SelectItem value="internal">Tickets Aurontek (Internos)</SelectItem>
                        <SelectItem value="platform">Tickets Plataforma (Empresas)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>
                        {isLoading ? 'Sincronizando con servidor...' : `Mostrando ${tickets.length} tickets registrados.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {/* Skeleton Loader simple table rows */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center space-x-4 py-4 border-b border-slate-100">
                                    <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={tickets}
                            meta={{ onUpdate: refetch }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TicketsPage;
