import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Activity, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useAuthStore } from '@/auth/auth.store';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PERMISSIONS } from '@/constants/permissions';

// Componente para Tarjeta de Estadísticas
const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const EmpresaDashboard = () => {
    const { user, hasPermission } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    // Filtros inteligentes RBAC
    const getAvailableFilters = () => {
        const filters: Array<{ value: string, label: string }> = [];

        // ASIGNADOS A MÍ - Si tiene permiso para ver asignados
        if (hasPermission(PERMISSIONS.TICKETS_VIEW_ASSIGNED)) {
            filters.push({ value: 'assigned', label: 'Asignados a mí' });
        }

        // CREADOS POR MÍ - Para todos
        filters.push({ value: 'my-tickets', label: 'Creados por mí' });

        // TODOS - Si tiene permiso
        if (hasPermission(PERMISSIONS.TICKETS_VIEW_ALL)) {
            filters.push({ value: 'all', label: 'Todos de mi empresa' });
        }

        return filters;
    };

    const availableFilters = getAvailableFilters();
    const [ticketFilter, setTicketFilter] = useState(availableFilters[0]?.value || 'my-tickets');

    // Fetch Tickets (Backend debe filtrar por empresa y permisos RBAC)
    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['my-tickets', user?.empresaId, user?.id, ticketFilter],
        queryFn: async () => {
            try {
                // Backend filtra automáticamente por:
                // 1. empresaId del usuario (middlewares verificarToken)
                // 2. Permisos RBAC (ver todos, asignados, creados)
                const baseTickets = await ticketsService.getTickets({
                    empresaId: user?.empresaId
                });

                console.log('✅ Tickets obtenidos:', baseTickets.length, 'Filtro:', ticketFilter);

                // Aplicar filtro seleccionado (segunda validación en frontend)
                let filtered = baseTickets;

                if (ticketFilter === 'my-tickets') {
                    filtered = baseTickets.filter((t: any) => {
                        const creatorId = t.usuarioCreador?._id || t.usuarioCreador;
                        const userId = user?._id || user?.id;
                        return creatorId && userId && creatorId.toString() === userId.toString();
                    });
                } else if (ticketFilter === 'assigned') {
                    filtered = baseTickets.filter((t: any) => {
                        const assignedId = t.agenteAsignado?._id || t.agenteAsignado;
                        const userId = user?._id || user?.id;
                        return assignedId && userId && String(assignedId) === String(userId);
                    });
                }
                // 'all' no filtra adicional

                return filtered;
            } catch (err: any) {
                console.error('❌ Error obteniendo tickets:', err.message);
                throw err;
            }
        },
        enabled: !!user?.id && !!user?.empresaId, // Requiere usuario y empresa
    });

    // Calcular Estadísticas (normalizar estados)
    const ticketsArray = Array.isArray(tickets) ? tickets : [];

    // Normalizar función para estados
    const normalizeEstado = (estado: string): string => {
        if (!estado) return '';
        const estadoLower = estado.toLowerCase().trim();
        // Mapear variaciones
        if (estadoLower.includes('abierto')) return 'abierto';
        if (estadoLower.includes('en_proceso') || estadoLower.includes('en proceso') || estadoLower.includes('enproceso')) return 'en_proceso';
        if (estadoLower.includes('en_espera') || estadoLower.includes('en espera') || estadoLower.includes('enespera')) return 'en_espera';
        if (estadoLower.includes('cerrado') || estadoLower.includes('resuelto')) return 'cerrado';
        return estadoLower;
    };

    const stats = {
        total: ticketsArray.length,
        abiertos: ticketsArray.filter((t: any) => normalizeEstado(t.estado) === 'abierto').length,
        enProceso: ticketsArray.filter((t: any) => normalizeEstado(t.estado) === 'en_proceso').length,
        cerrados: ticketsArray.filter((t: any) => normalizeEstado(t.estado) === 'cerrado').length,
    };

    // Filtrar y ordenar para Actividad Reciente + Buscador
    const recentTickets = [...ticketsArray]
        .filter((t: any) => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();

            // Safe access to fields
            const title = t.titulo?.toLowerCase() || '';
            const id = (t._id || t.id || '').toLowerCase(); // Support both _id and id
            const service = (t.servicio || t.servicioNombre || '').toLowerCase();

            // Agent name check
            let agentName = '';
            if (t.agenteAsignado) {
                if (typeof t.agenteAsignado === 'string') {
                    // If it's just an ID, we might not want to search by it unless the user types the ID
                    // but usually 'assigned user' implies name. If we don't have the name, skip.
                    agentName = '';
                } else if (typeof t.agenteAsignado === 'object') {
                    agentName = (t.agenteAsignado.nombre || '').toLowerCase();
                }
            }

            return (
                title.includes(term) ||
                id.includes(term) ||
                service.includes(term) ||
                agentName.includes(term)
            );
        })
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {t('company_portal.dashboard.welcome', { name: user?.nombre?.split(' ')[0] })}
                    </h2>
                    <p className="text-slate-500">
                        {t('company_portal.dashboard.summary', { company: user?.empresa || 'Empresa' })}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button onClick={() => navigate('/empresa/nuevo-ticket')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> {t('company_portal.dashboard.new_ticket')}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={t('company_portal.dashboard.stats.total')}
                    value={isLoading ? '-' : stats.total}
                    icon={Ticket}
                    color="text-blue-600"
                    description={t('company_portal.dashboard.stats.total_desc')}
                />
                <StatCard
                    title={t('company_portal.dashboard.stats.open')}
                    value={isLoading ? '-' : stats.abiertos}
                    icon={AlertCircle}
                    color="text-red-500"
                    description={t('company_portal.dashboard.stats.open_desc')}
                />
                <StatCard
                    title={t('company_portal.dashboard.stats.in_process')}
                    value={isLoading ? '-' : stats.enProceso}
                    icon={Activity}
                    color="text-orange-500"
                    description={t('company_portal.dashboard.stats.in_process_desc')}
                />
                <StatCard
                    title={t('company_portal.dashboard.stats.closed')}
                    value={isLoading ? '-' : stats.cerrados}
                    icon={CheckCircle}
                    color="text-green-500"
                    description={t('company_portal.dashboard.stats.closed_desc')}
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4 md:col-span-5 border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('company_portal.dashboard.recent_activity.title')}</CardTitle>
                            <CardDescription>{t('company_portal.dashboard.recent_activity.desc')}</CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Buscador */}
                            <div className="relative w-full sm:w-[200px]">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar ticket..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            {/* Filtros RBAC */}
                            {availableFilters.length > 1 && (
                                <Select value={ticketFilter} onValueChange={setTicketFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableFilters.map(filter => (
                                            <SelectItem key={filter.value} value={filter.value}>
                                                {filter.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-sm text-slate-500">{t('common.loading')}</p>
                            ) : recentTickets.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>{searchTerm ? 'No se encontraron tickets con esa búsqueda.' : t('company_portal.dashboard.recent_activity.no_activity')}</p>
                                    {!searchTerm && (
                                        <Button variant="link" onClick={() => navigate('/empresa/nuevo-ticket')}>
                                            {t('company_portal.dashboard.recent_activity.create_first')}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                recentTickets.map((ticket: any) => (
                                    <div
                                        key={ticket._id || ticket.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-slate-50 p-2 rounded-md transition-colors cursor-pointer"
                                        onClick={() => navigate(`/empresa/tickets/${ticket._id || ticket.id}`)}
                                    >
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{ticket._id ? ticket._id.slice(-6).toUpperCase() : '---'}
                                                </span>
                                                <p className="text-sm font-medium leading-none truncate max-w-[200px] md:max-w-md">{ticket.titulo}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                <span>{ticket.servicio || ticket.servicioNombre}</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                {ticket.agenteAsignado && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-blue-600 font-medium">
                                                            👤 {typeof ticket.agenteAsignado === 'string'
                                                                ? 'Asignado'
                                                                : ticket.agenteAsignado.nombre || 'Agente'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap ${normalizeEstado(ticket.estado) === 'abierto' ? 'bg-red-100 text-red-600' :
                                                normalizeEstado(ticket.estado) === 'en_proceso' ? 'bg-orange-100 text-orange-600' :
                                                    normalizeEstado(ticket.estado) === 'en_espera' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-green-100 text-green-600'
                                                }`}>
                                                {ticket.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Only if user has permission to manage services or users */}
                {(hasPermission(PERMISSIONS.SERVICIOS_VIEW_LOCAL) || hasPermission(PERMISSIONS.USERS_VIEW)) && (
                    <Card className="col-span-3 md:col-span-2 border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>{t('company_portal.dashboard.quick_actions.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {hasPermission(PERMISSIONS.SERVICIOS_VIEW_LOCAL) && (
                                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => navigate('/empresa/servicios')}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span>{t('company_portal.dashboard.quick_actions.catalog')}</span>
                                        <span className="text-xs text-slate-500 font-normal">{t('company_portal.dashboard.quick_actions.catalog_desc')}</span>
                                    </div>
                                </Button>
                            )}

                            {hasPermission(PERMISSIONS.USERS_VIEW) && (
                                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => navigate('/empresa/equipo')}>
                                    <Ticket className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col items-start">
                                        <span>{t('company_portal.dashboard.quick_actions.team')}</span>
                                        <span className="text-xs text-slate-500 font-normal">{t('company_portal.dashboard.quick_actions.team_desc')}</span>
                                    </div>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EmpresaDashboard;
