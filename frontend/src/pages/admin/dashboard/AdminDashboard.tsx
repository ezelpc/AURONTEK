import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { ticketsService } from '@/api/tickets.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Clock, Building2, Users } from 'lucide-react';



const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {loading ? <span className="text-slate-300 text-lg">...</span> : value}
            </div>
        </CardContent>
    </Card>
);

const AdminDashboard = () => {
    // 1. Fetch Users & Companies Stats (Consolidated Endpoint)
    const { data: generalStats, isLoading: loadingGeneral } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: userService.getDashboardStats,
        staleTime: 60000
    });

    console.log('Dashboard General Stats:', generalStats);

    // 2. Fetch Global Stats (Tickets)
    const { data: ticketStats, isLoading: loadingTicketStats } = useQuery({
        queryKey: ['admin-ticket-stats'],
        queryFn: ticketsService.getGlobalStats,
        refetchInterval: 30000
    });

    const activeCompanies = generalStats?.empresas?.activas || 0;
    const totalUsers = generalStats?.usuarios?.total || 0;

    // Data for Charts
    const dataStatus = ticketStats?.graficas?.estados?.map((e: any) => ({
        name: e.name.charAt(0).toUpperCase() + e.name.slice(1).replace('_', ' '),
        value: e.value
    })) || [];

    const dataPriority = ticketStats?.graficas?.prioridad?.map((p: any) => ({
        name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
        value: p.value,
        color: p.name === 'baja' ? '#94a3b8' :
            p.name === 'media' ? '#60a5fa' :
                p.name === 'alta' ? '#f59e0b' : '#ef4444'
    })) || [];

    const loadingAll = loadingGeneral || loadingTicketStats;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-slate-500">Vista general del estado del sistema.</p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Empresas Activas"
                    value={activeCompanies}
                    icon={Building2}
                    color="text-indigo-500"
                    loading={loadingGeneral}
                />
                <StatCard
                    title="Usuarios Totales"
                    value={totalUsers}
                    icon={Users}
                    color="text-blue-500"
                    loading={loadingGeneral}
                />
                <StatCard
                    title="Tickets Pendientes"
                    value={ticketStats?.kpis?.pendientes || 0}
                    icon={Clock}
                    color="text-orange-500"
                    loading={loadingTicketStats}
                />
                <StatCard
                    title="Críticos"
                    value={ticketStats?.kpis?.criticos || 0}
                    icon={AlertTriangle}
                    color="text-red-500"
                    loading={loadingTicketStats}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Bar Chart (4 cols) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Volumen de Tickets</CardTitle>
                        <CardDescription>Distribución por estado actual.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loadingAll ? (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">Cargando datos...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dataStatus.length > 0 ? dataStatus : [{ name: 'Sin datos', value: 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart (3 cols) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Carga por Prioridad</CardTitle>
                        <CardDescription>Severidad de incidentes activos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingAll ? (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">Cargando datos...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={dataPriority.length > 0 ? dataPriority : [{ name: 'Sin datos', value: 1, color: '#e2e8f0' }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(dataPriority.length > 0 ? dataPriority : [{ name: 'Sin datos', value: 1, color: '#e2e8f0' }]).map((entry: any, index: any) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
