import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/user.service';
import { companiesService } from '@/api/companies.service';
import { rolesService } from '@/api/roles.service';
import { careGroupsService } from '@/api/care-groups.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, X, CheckCircle, Copy } from 'lucide-react';

interface UserFormProps {
    userToEdit?: any;
    onSuccess?: () => void;
}

const UserForm = ({ userToEdit, onSuccess }: UserFormProps) => {
    const queryClient = useQueryClient();
    const isEditMode = !!userToEdit;

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [puesto, setPuesto] = useState('');
    const [empresaId, setEmpresaId] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedCareGroups, setSelectedCareGroups] = useState<string[]>([]);
    const [activo, setActivo] = useState(true);
    const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string>('');
    const [fotoPreview, setFotoPreview] = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Success Modal State
    const [showCredentials, setShowCredentials] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ password: string, email: string } | null>(null);

    // Populate form when editing
    useEffect(() => {
        if (userToEdit) {
            setNombre(userToEdit.nombre || '');
            setEmail(userToEdit.email || userToEdit.correo || '');
            setTelefono(userToEdit.telefono || '');
            setPuesto(userToEdit.puesto || '');
            setEmpresaId(userToEdit.empresaId || userToEdit.empresa || '');
            setSelectedRole(userToEdit.rol || '');
            setSelectedCareGroups(userToEdit.habilidades || []);
            setActivo(userToEdit.activo !== false);
            setFotoPreview(userToEdit.fotoPerfil || '');
            setPassword('');
        }
    }, [userToEdit]);

    // Fetch Companies
    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: companiesService.getCompanies,
    });

    // Fetch Roles (filtered by company if selected)
    const { data: roles = [] } = useQuery({
        queryKey: ['roles', empresaId],
        queryFn: () => rolesService.getRoles(empresaId || undefined),
        enabled: !!empresaId
    });

    // Fetch Care Groups
    const { data: careGroups = [] } = useQuery({
        queryKey: ['care-groups'],
        queryFn: careGroupsService.getAll
    });

    // Upload photo to Cloudinary
    const uploadPhotoToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aurontek_users'); // Configure this in Cloudinary
        formData.append('folder', 'usuarios');

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) throw new Error('Error uploading image');

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            throw new Error('Error al subir la imagen');
        }
    };

    // Create Mutation
    const createUserMutation = useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });

            // If we have created credentials locally (auto-generated or manual), show modal
            if (createdCredentials) {
                setShowCredentials(true);
            } else {
                toast.success('Usuario creado correctamente');
                if (onSuccess) onSuccess();
                resetForm();
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al crear usuario');
        }
    });

    // Update Mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario actualizado correctamente');
            if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.msg || 'Error al actualizar usuario');
        }
    });

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const resetForm = () => {
        setNombre('');
        setEmail('');
        setPassword('');
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

        let photoUrl = fotoPreview;

        // Upload photo if new file selected
        if (fotoPerfil) {
            setUploadingPhoto(true);
            try {
                photoUrl = await uploadPhotoToCloudinary(fotoPerfil);
            } catch (error) {
                toast.error('Error al subir la foto');
                setUploadingPhoto(false);
                return;
            }
            setUploadingPhoto(false);
        }

        if (isEditMode) {
            // Update mode
            const updateData: any = {
                nombre,
                correo: email,
                telefono,
                puesto,
                empresa: empresaId,
                rol: selectedRole,
                habilidades: selectedCareGroups,
                activo,
                fotoPerfil: photoUrl
            };

            // Only include password if provided
            if (password) {
                updateData.contraseña = password;
            }

            updateUserMutation.mutate({
                id: userToEdit._id || userToEdit.id,
                data: updateData
            });
        } else {
        } else {
            // Create mode
            if (!selectedRole) {
                return toast.error('Selecciona un rol');
            }

            let finalPassword = password;
            if (!finalPassword) {
                finalPassword = generatePassword();
            }

            // Save for modal
            setCreatedCredentials({
                password: finalPassword,
                email: email
            });

            const createData: any = {
                nombre,
                correo: email,
                contraseña: finalPassword,
                telefono,
                puesto,
                empresa: empresaId,
                rol: selectedRole,
                habilidades: selectedCareGroups,
                activo,
                fotoPerfil: photoUrl
            };

            createUserMutation.mutate(createData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    {fotoPreview ? (
                        <div className="relative">
                            <img
                                src={fotoPreview}
                                alt="Preview"
                                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFotoPerfil(null);
                                    setFotoPreview('');
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                            <Upload className="h-8 w-8 text-slate-400" />
                        </div>
                    )}
                </div>
                <div>
                    <Label htmlFor="foto" className="cursor-pointer">
                        <div className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors">
                            {fotoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                        </div>
                    </Label>
                    <Input
                        id="foto"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG o GIF (máx. 2MB)</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Juan Pérez"
                        required
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label>Correo Electrónico *</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@empresa.com"
                        required
                    />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+52 123 456 7890"
                    />
                </div>

                {/* Puesto */}
                <div className="space-y-2">
                    <Label>Puesto</Label>
                    <Input
                        value={puesto}
                        onChange={(e) => setPuesto(e.target.value)}
                        placeholder="Desarrollador Senior"
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label>Contraseña {isEditMode && '(dejar vacío para mantener)'}</Label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isEditMode ? 'Nueva contraseña' : 'Contraseña'}
                        required={!isEditMode}
                    />
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                    <Label>Empresa *</Label>
                    <Select value={empresaId} onValueChange={setEmpresaId} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa" />
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

                {/* Rol */}
                <div className="space-y-2 col-span-2">
                    <Label>Rol *</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole} required disabled={!empresaId}>
                        <SelectTrigger>
                            <SelectValue placeholder={empresaId ? "Seleccionar rol" : "Primero selecciona una empresa"} />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role: any) => (
                                <SelectItem key={role._id || role.id} value={role.nombre}>
                                    {role.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grupos de Atención */}
            <div className="space-y-2 col-span-2">
                <Label className="text-slate-900 dark:text-slate-100">Grupos de Atención</Label>
                <Select
                    value={selectedCareGroups[0] || ''}
                    onValueChange={(value) => {
                        if (value && !selectedCareGroups.includes(value)) {
                            setSelectedCareGroups([...selectedCareGroups, value]);
                        }
                    }}
                >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                        <SelectValue placeholder="Seleccionar grupos de atención" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        {careGroups.map((group: any) => (
                            <SelectItem
                                key={group._id}
                                value={group.nombre}
                                className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
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
                            <div
                                key={index}
                                className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm"
                            >
                                <span>{groupName}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCareGroups(selectedCareGroups.filter(g => g !== groupName))}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
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
                    Usuario activo
                </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
                <Button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending || uploadingPhoto}
                >
                    {uploadingPhoto ? 'Subiendo foto...' : isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}
                </Button>
            </div>
        </form>
            {/* Success Dialog */ }
    {
        showCredentials && createdCredentials && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 border border-slate-100 dark:border-slate-800">

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50 dark:ring-green-900/10">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">¡Usuario Creado!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            El usuario ha sido registrado exitosamente.
                        </p>
                    </div>

                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Contraseña Generada
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
                                Hemos enviado las credenciales al correo: <br />
                                <span className="font-semibold text-slate-900 dark:text-slate-200 block mt-0.5">{createdCredentials.email}</span>
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={() => {
                                setShowCredentials(false);
                                if (onSuccess) onSuccess();
                                resetForm();
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 py-6 text-lg font-medium"
                        >
                            Finalizar
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
    );
};

export default UserForm;
