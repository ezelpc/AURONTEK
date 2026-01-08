import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { companiesService } from '@/api/companies.service';
import { rolesService } from '@/api/roles.service';
import { careGroupsService } from '@/api/care-groups.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Mail, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface UserFormProps {
    userToEdit?: any;
    onSuccess?: () => void;
    tipo?: 'local' | 'global' | null;
}

const UserForm = ({ userToEdit, onSuccess, tipo }: UserFormProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isEditMode = !!userToEdit;

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [puesto, setPuesto] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedCareGroups, setSelectedCareGroups] = useState<string[]>([]);
    const [activo, setActivo] = useState(true);
    const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (userToEdit) {
            setNombre(userToEdit.nombre || '');
            setEmail(userToEdit.email || userToEdit.correo || '');
            setTelefono(userToEdit.telefono || '');
            setPuesto(userToEdit.puesto || '');
            setEmpresaId(userToEdit.empresaId || userToEdit.empresa || '');
            setSelectedRole(userToEdit.rol || '');
            setSelectedCareGroups(userToEdit.habilidades || userToEdit.gruposDeAtencion || []);
            setActivo(userToEdit.activo !== false);
            setFotoPreview(userToEdit.fotoPerfil || '');
        }
    }, [userToEdit]);

    // Fetch Companies
    const { data: allCompanies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: companiesService.getCompanies,
    });

    // Find AurontekHQ
    const aurontekHQ = allCompanies?.find((c: any) => c.rfc === 'AURONTEK001');
    const aurontekHQId = aurontekHQ?._id || aurontekHQ?.id;

    // Filter companies based on tipo
    const companies = tipo === 'global'
        ? allCompanies.filter((c: any) => (c._id || c.id) !== aurontekHQId)
        : allCompanies;

    // Auto-assign AurontekHQ for local users
    useEffect(() => {
        if (tipo === 'local' && aurontekHQId && !isEditMode) {
            setEmpresaId(aurontekHQId);
        }
    }, [tipo, aurontekHQId, isEditMode]);

    // Fetch Roles (filtered by company)
    const { data: roles = [] } = useQuery({
        queryKey: ['roles', empresaId],
        queryFn: () => rolesService.getRoles({ empresaId }),
        enabled: !!empresaId
    });

    // Fetch Care Groups (filtered by company)
    const { data: allCareGroups = [] } = useQuery({
        queryKey: ['care-groups'],
        queryFn: careGroupsService.getAll
    });

    // Filter care groups by selected company
    const careGroups = empresaId
        ? allCareGroups.filter((group: any) => {
            const groupEmpresaId = group.empresa?._id || group.empresa?.id || group.empresa || group.empresaId;
            // Show if global (no company) OR belongs to selected company
            return !groupEmpresaId || String(groupEmpresaId) === String(empresaId);
        })
        : [];

    // Upload photo to Cloudinary (optional - skip if not configured)
    const uploadPhotoToCloudinary = async (file: File): Promise<string> => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        // Skip upload if Cloudinary is not configured
        if (!cloudName || cloudName === 'your-cloud-name') {
            console.log('⚠️ Cloudinary not configured, skipping photo upload');
            throw new Error('Cloudinary not configured');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aurontek_users');
        formData.append('folder', 'usuarios');

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) throw new Error('Error uploading image');

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error('Error al subir la imagen');
        }
    };

    // Create Mutation
    const createUserMutation = useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('users.form.create_btn') + ' ' + t('common.success'), {
                description: t('users.form.auto_password')
            });
            if (onSuccess) onSuccess();
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
        }
    });

    // Update Mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('users.form.update_btn') + ' ' + t('common.success'));
            if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || t('common.error'));
        }
    });

    const resetForm = () => {
        setNombre('');
        setEmail('');
        setTelefono('');
        setPuesto('');
        setEmpresaId('');
        setSelectedRole('');
        setSelectedCareGroups([]);
        setActivo(true);
        setFotoPerfil(null);
        setFotoPreview('');
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFotoPerfil(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresaId) {
            return toast.error(t('users.form.select_company_first'));
        }

        if (!selectedRole) {
            return toast.error(t('users.form.select_role'));
        }

        let photoUrl = fotoPreview || '';

        // Upload photo if new file selected (optional)
        if (fotoPerfil) {
            setUploadingPhoto(true);
            try {
                photoUrl = await uploadPhotoToCloudinary(fotoPerfil);
            } catch (error) {
                // Photo upload is optional, so we continue without it
                toast.warning('No se pudo subir la foto, pero el usuario se creará sin ella');
                photoUrl = '';
            }
            setUploadingPhoto(false);
        }

        const userData: any = {
            nombre,
            correo: email,
            telefono,
            puesto,
            empresa: empresaId,
            rol: selectedRole,
            habilidades: selectedCareGroups,
            gruposDeAtencion: selectedCareGroups,
            activo,
            fotoPerfil: photoUrl
        };

        if (isEditMode) {
            updateUserMutation.mutate({
                id: userToEdit._id || userToEdit.id,
                data: userData
            });
        } else {
            // En modo creación, el backend generará la contraseña automáticamente
            createUserMutation.mutate(userData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert informativo */}
            {!isEditMode && (
                <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                        {t('users.form.auto_password')}
                    </AlertDescription>
                </Alert>
            )}

            {/* Photo Upload */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    {fotoPreview ? (
                        <div className="relative">
                            <img
                                src={fotoPreview}
                                alt="Preview"
                                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFotoPerfil(null);
                                    setFotoPreview('');
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <Upload className="h-8 w-8 text-slate-400" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <Label htmlFor="foto" className="cursor-pointer">
                        <div className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-sm font-medium transition-colors inline-block">
                            {fotoPreview ? t('users.form.change_photo') : t('users.form.upload_photo')}
                        </div>
                    </Label>
                    <Input
                        id="foto"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {t('users.form.photo_help')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                    <Label htmlFor="nombre">
                        {t('users.form.fullname')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Juan Pérez García"
                        required
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">
                        {t('users.form.email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan.perez@empresa.com"
                        required
                    />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                    <Label htmlFor="telefono">{t('users.form.phone')}</Label>
                    <Input
                        id="telefono"
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+52 123 456 7890"
                    />
                </div>

                {/* Puesto */}
                <div className="space-y-2">
                    <Label htmlFor="puesto">{t('users.form.position')}</Label>
                    <Input
                        id="puesto"
                        value={puesto}
                        onChange={(e) => setPuesto(e.target.value)}
                        placeholder="Desarrollador Senior"
                    />
                </div>

                {/* Empresa - Hide for local users */}
                {tipo !== 'local' && (
                    <div className="space-y-2">
                        <Label>
                            {t('users.form.company')} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={empresaId} onValueChange={(val) => {
                            setEmpresaId(val);
                            setSelectedRole('');
                            setSelectedCareGroups([]);
                        }} required>
                            <SelectTrigger>
                                <SelectValue placeholder={t('users.form.select_company')} />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((company: any) => (
                                    <SelectItem key={company._id || company.id} value={company._id || company.id}>
                                        {company.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Rol */}
                <div className="space-y-2">
                    <Label>
                        {t('users.form.role')} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole} required disabled={!empresaId}>
                        <SelectTrigger>
                            <SelectValue placeholder={empresaId ? t('users.form.select_role') : t('users.form.select_company_first')} />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role: any) => (
                                <SelectItem key={role._id || role.id} value={role.nombre}>
                                    <div className="flex items-center gap-2">
                                        <span>{role.nombre}</span>
                                        {role.descripcion && (
                                            <span className="text-xs text-slate-500">({role.descripcion})</span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grupos de Atención */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    {t('users.form.care_groups')}
                    <Info className="h-3 w-3 text-slate-400" />
                </Label>
                <Select
                    value={selectedCareGroups[0] || ''}
                    onValueChange={(value) => {
                        if (value && !selectedCareGroups.includes(value)) {
                            setSelectedCareGroups([...selectedCareGroups, value]);
                        }
                    }}
                    disabled={!empresaId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={empresaId ? t('users.form.select_groups') : t('users.form.select_company_first')} />
                    </SelectTrigger>
                    <SelectContent>
                        {careGroups.map((group: any) => (
                            <SelectItem
                                key={group._id}
                                value={group.nombre}
                                disabled={selectedCareGroups.includes(group.nombre)}
                            >
                                {group.nombre}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Selected groups */}
                {selectedCareGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selectedCareGroups.map((groupName, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                            >
                                <span>{groupName}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCareGroups(selectedCareGroups.filter(g => g !== groupName))}
                                    className="hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Estado Activo */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="activo"
                    checked={activo}
                    onCheckedChange={(checked) => setActivo(checked as boolean)}
                />
                <label
                    htmlFor="activo"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                    {t('users.form.active')}
                </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending || uploadingPhoto}
                    className="min-w-[150px]"
                >
                    {uploadingPhoto ? t('users.form.uploading') : isEditMode ? t('users.form.update_btn') : t('users.form.create_btn')}
                </Button>
            </div>
        </form>
    );
};

export default UserForm;
