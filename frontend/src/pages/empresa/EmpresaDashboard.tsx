import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsService } from '@/api/tickets.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Activity, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useAuthStore } from '@/auth/auth.store';
import { useTranslation } from 'react-i18next';

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

const EmpresaDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Fetch Tickets (Backend debe filtrar por empresa)
    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['my-tickets', user?.empresaId],
        queryFn: () => ticketsService.getTickets({ empresaId: user?.empresaId })
    });

    // Calcular Estadísticas
    const ticketsArray = Array.isArray(tickets) ? tickets : [];
    const stats = {
        total: ticketsArray.length,
        abiertos: ticketsArray.filter((t: any) => t.estado === 'ABIERTO').length,
        enProceso: ticketsArray.filter((t: any) => t.estado === 'EN_PROCESO').length,
        cerrados: ticketsArray.filter((t: any) => t.estado === 'CERRADO' || t.estado === 'RESUELTO').length,
    };


    // Últimos 5 tickets
    const recentTickets = [...ticketsArray].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

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
                <Button onClick={() => navigate('/empresa/nuevo-ticket')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> {t('company_portal.dashboard.new_ticket')}
                </Button>
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
                    <CardHeader>
                        <CardTitle>{t('company_portal.dashboard.recent_activity.title')}</CardTitle>
                        <CardDescription>{t('company_portal.dashboard.recent_activity.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-sm text-slate-500">{t('common.loading')}</p>
                            ) : recentTickets.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>{t('company_portal.dashboard.recent_activity.no_activity')}</p>
                                    <Button variant="link" onClick={() => navigate('/empresa/nuevo-ticket')}>
                                        {t('company_portal.dashboard.recent_activity.create_first')}
                                    </Button>
                                </div>
                            ) : (
                                recentTickets.map((ticket: any) => (
                                    <div
                                        key={ticket._id || ticket.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 hover:bg-slate-50 p-2 rounded-md transition-colors cursor-pointer"
                                        onClick={() => navigate(`/empresa/tickets/${ticket._id || ticket.id}`)}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none truncate max-w-[200px] md:max-w-md">{ticket.titulo}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{ticket.servicio}</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${ticket.estado === 'ABIERTO' ? 'bg-red-100 text-red-600' :
                                                ticket.estado === 'EN_PROCESO' ? 'bg-orange-100 text-orange-600' :
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

                {/* Quick Actions */}
                <Card className="col-span-3 md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('company_portal.dashboard.quick_actions.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => navigate('/empresa/servicios')}>
                            <Clock className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start">
                                <span>{t('company_portal.dashboard.quick_actions.catalog')}</span>
                                <span className="text-xs text-slate-500 font-normal">{t('company_portal.dashboard.quick_actions.catalog_desc')}</span>
                            </div>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => navigate('/empresa/equipo')}>
                            <Ticket className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start">
                                <span>{t('company_portal.dashboard.quick_actions.team')}</span>
                                <span className="text-xs text-slate-500 font-normal">{t('company_portal.dashboard.quick_actions.team_desc')}</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EmpresaDashboard;
