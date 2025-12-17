import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/api/companies.service';
import { Empresa } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface Contratante {
    nombre: string;
    correo: string;
    telefono?: string;
    ext?: string;
    puesto?: string;
    rol?: string; // Rol del contratante
}

interface CompanyFormProps {
    company?: Empresa;
    onSuccess: () => void;
    onCancel: () => void;
}

const CompanyForm = ({ company, onSuccess, onCancel }: CompanyFormProps) => {
    const queryClient = useQueryClient();
    const isEditing = !!company;

    // Estado del formulario - Datos de la empresa
    const [nombre, setNombre] = useState('');
    const [rfc, setRfc] = useState('');
    const [correo, setCorreo] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [plan, setPlan] = useState('Anual');

    // Estado para contratantes
    const [contratantes, setContratantes] = useState<Contratante[]>([]);
    const [showContratanteForm, setShowContratanteForm] = useState(false);
    const [nuevoContratante, setNuevoContratante] = useState<Contratante>({
        nombre: '',
        correo: '',
        telefono: '',
        ext: '',
        puesto: '',
        rol: 'admin-empresa' // Rol por defecto
    });

    // Cargar datos si es edición
    useEffect(() => {
        if (company) {
            setNombre(company.nombre);
            setRfc(company.rfc);
            setCorreo(company.correo);
            setDireccion(company.direccion || '');
            setTelefono(company.telefono || '');
            if (company.licencia && company.licencia.length > 0) {
                setPlan(company.licencia[0].plan);
            }
            if (company.contratantes && company.contratantes.length > 0) {
                setContratantes(company.contratantes);
            }
        }
    }, [company]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (isEditing && company) {
                return companiesService.updateCompany(company._id || company.id!, data);
            } else {
                return companiesService.createCompany(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(isEditing ? 'Empresa actualizada' : 'Empresa creada');
            onSuccess();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error en la operación');
        }
    });

    const handleAgregarContratante = () => {
        if (!nuevoContratante.nombre || !nuevoContratante.correo) {
            toast.error('Nombre y correo son requeridos');
            return;
        }

        setContratantes([...contratantes, nuevoContratante]);
        setNuevoContratante({
            nombre: '',
            correo: '',
            telefono: '',
            ext: '',
            puesto: '',
            rol: 'admin-empresa'
        });
        setShowContratanteForm(false);
        toast.success('Contratante agregado');
    };

    const handleEliminarContratante = (index: number) => {
        setContratantes(contratantes.filter((_, i) => i !== index));
        toast.success('Contratante eliminado');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            nombre,
            rfc,
            correo,
            direccion,
            telefono,
            licencia: [{
                fecha_inicio: isEditing && company?.licencia?.[0]?.fecha_inicio
                    ? company.licencia[0].fecha_inicio
                    : new Date().toISOString(),
                plan: plan,
                estado: true
            }],
            contratantes: contratantes
        };

        mutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la Empresa */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nombre de la Empresa *</Label>
                        <Input
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Empresa S.A. de C.V."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>RFC *</Label>
                        <Input
                            value={rfc}
                            onChange={e => setRfc(e.target.value.toUpperCase())}
                            placeholder="ABC123456XYZ"
                            maxLength={13}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Correo de Contacto *</Label>
                        <Input
                            type="email"
                            value={correo}
                            onChange={e => setCorreo(e.target.value)}
                            placeholder="contacto@empresa.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input
                            type="tel"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            placeholder="+52 123 456 7890"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Dirección</Label>
                        <Input
                            value={direccion}
                            onChange={e => setDireccion(e.target.value)}
                            placeholder="Calle, Número, Colonia, Ciudad, Estado, CP"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Plan de Licencia *</Label>
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Mensual">Mensual</SelectItem>
                                <SelectItem value="Trimestral">Trimestral</SelectItem>
                                <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Contratantes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Contratantes</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowContratanteForm(!showContratanteForm)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Contratante
                    </Button>
                </div>

                {/* Formulario de nuevo contratante */}
                {showContratanteForm && (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="text-sm">Nuevo Contratante</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Nombre *</Label>
                                    <Input
                                        className="h-8"
                                        value={nuevoContratante.nombre}
                                        onChange={e => setNuevoContratante({ ...nuevoContratante, nombre: e.target.value })}
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Correo *</Label>
                                    <Input
                                        className="h-8"
                                        type="email"
                                        value={nuevoContratante.correo}
                                        onChange={e => setNuevoContratante({ ...nuevoContratante, correo: e.target.value })}
                                        placeholder="juan@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Teléfono</Label>
                                    <Input
                                        className="h-9"
                                        value={nuevoContratante.telefono}
                                        onChange={e => setNuevoContratante({ ...nuevoContratante, telefono: e.target.value })}
                                        placeholder="+52 123 456 7890"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Extensión</Label>
                                    <Input
                                        className="h-8"
                                        value={nuevoContratante.ext}
                                        onChange={e => setNuevoContratante({ ...nuevoContratante, ext: e.target.value })}
                                        placeholder="1234"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs dark:text-slate-200">Puesto</Label>
                                    <Input
                                        className="h-8 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs dark:text-slate-200">Rol *</Label>
                                    <Select
                                        value={nuevoContratante.rol}
                                        onValueChange={(value) => setNuevoContratante({ ...nuevoContratante, rol: value })}
                                    >
                                        <SelectTrigger className="h-9 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                            <SelectItem value="admin-empresa" className="dark:text-slate-100 dark:hover:bg-slate-700">
                                                Administrador de Empresa
                                            </SelectItem>
                                            <SelectItem value="usuario" className="dark:text-slate-100 dark:hover:bg-slate-700">
                                                Usuario
                                            </SelectItem>
                                            <SelectItem value="soporte" className="dark:text-slate-100 dark:hover:bg-slate-700">
                                                Soporte
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowContratanteForm(false);
                                        setNuevoContratante({ nombre: '', correo: '', telefono: '', ext: '', puesto: '' });
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAgregarContratante}
                                >
                                    Agregar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de contratantes */}
                {contratantes.length > 0 && (
                    <div className="space-y-2">
                        {contratantes.map((contratante, index) => (
                            <Card key={index} className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium">{contratante.nombre}</p>
                                            <p className="text-sm text-slate-500">{contratante.correo}</p>
                                            {contratante.puesto && (
                                                <p className="text-xs text-slate-400">{contratante.puesto}</p>
                                            )}
                                            {contratante.telefono && (
                                                <p className="text-xs text-slate-400">
                                                    Tel: {contratante.telefono} {contratante.ext && `Ext. ${contratante.ext}`}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEliminarContratante(index)}
                                        >
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {contratantes.length === 0 && !showContratanteForm && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No hay contratantes registrados. Agrega al menos uno.
                    </p>
                )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Empresa')}
                </Button>
            </div>
        </form>
    );
};

export default CompanyForm;
