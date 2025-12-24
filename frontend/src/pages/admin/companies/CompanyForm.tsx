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
import { Plus, X, CheckCircle, Copy } from 'lucide-react';

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

    const [plan, setPlan] = useState('Mensual');

    // State for success dialog
    const [showCredentials, setShowCredentials] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ password: string, accessCode: string, email: string } | null>(null);

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
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success(isEditing ? 'Empresa actualizada' : 'Empresa creada exitosamente');

            if (!isEditing && data.codigo_acceso && createdCredentials) {
                // Show credentials dialog for new companies
                setCreatedCredentials({
                    ...createdCredentials,
                    accessCode: data.codigo_acceso
                });
                setShowCredentials(true);
            } else {
                onSuccess();
            }
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

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing && contratantes.length === 0) {
            toast.error('Debes agregar al menos un contratante para que sea el administrador inicial.');
            return;
        }

        let payload: any = {};

        if (isEditing) {
            payload = {
                nombre,
                rfc,
                correo,
                direccion,
                telefono,
                licencia: [{
                    fecha_inicio: company?.licencia?.[0]?.fecha_inicio || new Date().toISOString(),
                    plan: plan,
                    estado: true
                }],
                contratantes: contratantes
            };
            mutation.mutate(payload);
        } else {
            // Generar contraseña automática
            const generatedPassword = generatePassword();
            const primerContratante = contratantes[0];

            // Guardar para el dialogo
            setCreatedCredentials({
                password: generatedPassword,
                accessCode: '', // Se llenará con la respuesta
                email: primerContratante.correo
            });

            payload = {
                // Datos Empresa
                nombreEmpresa: nombre,
                rfc,
                correo,
                direccion,
                telefono,

                // Datos Licencia
                plan,
                fecha_inicio: new Date().toISOString(),

                // Datos Contratante
                nombreContratante: primerContratante.nombre,
                telefonoContratante: primerContratante.telefono || '',
                puestoContratante: primerContratante.puesto || '',

                // Datos Admin (Usamos al primer contratante como admin inicial)
                nombreAdminInterno: primerContratante.nombre,
                correoAdminInterno: primerContratante.correo,
                passwordAdminInterno: generatedPassword
            };
            mutation.mutate(payload);
        }
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
                {/* Success Dialog */}
                {showCredentials && createdCredentials && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 border border-slate-100 dark:border-slate-800">

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50 dark:ring-green-900/10">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">¡Empresa Creada!</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">
                                    La empresa se ha registrado correctamente en el sistema.
                                </p>
                            </div>

                            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Código de Acceso
                                    </p>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between group">
                                        <p className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200 select-all tracking-wider">
                                            {createdCredentials.accessCode}
                                        </p>
                                        <Copy className="h-4 w-4 text-slate-400 group-hover:text-blue-500 cursor-pointer transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdCredentials.accessCode);
                                                toast.success('Código copiado');
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        Contraseña Admin
                                    </p>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between group">
                                        <p className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200 select-all tracking-wider">
                                            {createdCredentials.password}
                                        </p>
                                        <Copy className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 cursor-pointer transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdCredentials.password);
                                                toast.success('Contraseña copiada');
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20 mb-6">
                                    <span className="text-xl">📧</span>
                                    <p className="leading-snug">
                                        Hemos enviado estas credenciales al correo: <br />
                                        <span className="font-semibold text-slate-900 dark:text-slate-200 block mt-0.5">{createdCredentials.email}</span>
                                    </p>
                                </div>

                                <Button
                                    onClick={() => {
                                        setShowCredentials(false);
                                        onSuccess();
                                    }}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 py-6 text-lg font-medium"
                                >
                                    Entendido, finalizar
                                </Button>
                            </div>
                        </div>
                    </div>
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
