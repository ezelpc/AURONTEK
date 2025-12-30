import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ticketsService } from '@/api/tickets.service';
import { companiesService } from '@/api/companies.service';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/auth/auth.store';

const TicketsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [searchParams] = useSearchParams();
    const tipo = searchParams.get('tipo') || 'local'; // Default to 'local'

    const [ticketFilter, setTicketFilter] = useState<'all' | 'created_by_me' | 'assigned'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');

    // Determine which tickets to fetch based on 'tipo' parameter
    const isLocalView = tipo === 'local'; // Local = AurontekHQ internal tickets

    // Fetch companies list for global view filter
    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: () => companiesService.getCompanies(),
        enabled: !isLocalView, // Only fetch for global view
    });

    // Fetching tickets based on view type
    const {
        data: tickets = [],
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['tickets', tipo, ticketFilter, selectedCompany],
        queryFn: async () => {
            // Base tickets based on tipo
            let baseTickets;
            if (isLocalView) {
                // Local view: Internal AurontekHQ tickets (no empresaId)
                baseTickets = await ticketsService.getInternalTickets();
            } else {
                // Global view: Company tickets (with empresaId)
                baseTickets = await ticketsService.getCompanyTickets();
            }

            // Apply additional filters
            if (ticketFilter === 'assigned') {
                baseTickets = baseTickets.filter((t: any) => {
                    const assignedId = t.agenteAsignado?._id || t.agenteAsignado;
                    const userId = user?._id || user?.id;
                    return assignedId && userId && assignedId.toString() === userId.toString();
                });
            } else if (ticketFilter === 'created_by_me') {
                baseTickets = baseTickets.filter((t: any) => {
                    const creatorId = t.usuarioCreador?._id || t.usuarioCreador;
                    const userId = user?._id || user?.id;
                    console.log('[DEBUG] Comparing creator:', creatorId, 'with user:', userId);
                    return creatorId && userId && creatorId.toString() === userId.toString();
                });
            }

            // Filter by company (only for global view)
            if (!isLocalView && selectedCompany !== 'all') {
                baseTickets = baseTickets.filter((t: any) => {
                    const ticketCompanyId = t.empresaId?._id || t.empresaId;
                    return ticketCompanyId && ticketCompanyId.toString() === selectedCompany;
                });
            }

            return baseTickets;
        },
        staleTime: 1000 * 60, // 1 minuto de caché
    });

    // Filter tickets by search term
    const filteredTickets = useMemo(() => {
        if (!searchTerm.trim()) return tickets;

        const searchLower = searchTerm.toLowerCase();
        return tickets.filter((ticket: any) =>
            ticket.titulo?.toLowerCase().includes(searchLower) ||
            ticket.descripcion?.toLowerCase().includes(searchLower) ||
            ticket._id?.toLowerCase().includes(searchLower) ||
            ticket.id?.toLowerCase().includes(searchLower) ||
            ticket.servicio?.toLowerCase().includes(searchLower) ||
            ticket.categoria?.toLowerCase().includes(searchLower)
        );
    }, [tickets, searchTerm]);

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

    // Dynamic title and description based on view type
    const pageTitle = isLocalView ? 'Tickets Locales' : 'Tickets Globales';
    const pageDescription = isLocalView
        ? 'Tickets internos de AurontekHQ'
        : 'Tickets de empresas reportando problemas con la plataforma';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
                    <p className="text-slate-500">{pageDescription}</p>
                </div>
                <div className="flex gap-2">
                    {/* Only show "New Ticket" button for local (internal) tickets */}
                    {isLocalView && (
                        <Button onClick={() => navigate('/admin/crear-ticket')} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Ticket
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por título, descripción, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <Select value={ticketFilter} onValueChange={(value: any) => setTicketFilter(value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {isLocalView && <SelectItem value="created_by_me">Creados por mí</SelectItem>}
                            <SelectItem value="assigned">Asignados a mí</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Company Filter (only for global view) */}
                {!isLocalView && (
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Filtrar por empresa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las empresas</SelectItem>
                            {companies
                                .filter((company: any) => {
                                    const name = company.nombre?.toLowerCase().replace(/\s+/g, '');
                                    return name !== 'aurontekhq';
                                })
                                .map((company: any) => (
                                    <SelectItem key={company._id} value={company._id}>
                                        {company.nombre}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>
                        {isLoading
                            ? 'Sincronizando con servidor...'
                            : `Mostrando ${filteredTickets.length} de ${tickets.length} tickets.`}
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
                            data={filteredTickets}
                            meta={{ onUpdate: refetch }}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TicketsPage;
