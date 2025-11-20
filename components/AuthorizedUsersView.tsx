import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { PlusIcon, EditIcon, DeleteIcon } from './Icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';

type UserRole = 'docente' | 'coordinador' | 'directivo' | 'administrativo';

interface Usuario {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

interface AuthorizedUsersViewProps {
  currentUser: { id: string; email: string; username: string; role: string };
}

export const AuthorizedUsersView: React.FC<AuthorizedUsersViewProps> = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'docente' as UserRole });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Error loading usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, email: user.email || '', password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'docente' });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ username: '', email: '', password: '', role: 'docente' });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setError(null);
      const username = formData.username.toLowerCase().trim();
      const email = formData.email.trim() || null;

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username,
          email,
          role: formData.role,
        };

        // Only update password if provided
        if (formData.password.trim()) {
          // In a real implementation, you would hash the password here
          // For now, we'll skip password updates from the UI
          // Password changes should be done through Supabase Auth
          setError('Para cambiar la contraseña, usa la función de recuperación de contraseña');
          return;
        }

        const { error: updateError } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
      } else {
        // Create new user - use signUp to create in Supabase Auth, then in usuarios table
        const authEmail = email || `${username}@manglarnet.local`;

        // Create user in Supabase Auth using signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: formData.password,
        });

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            throw new Error('Este usuario ya está registrado');
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario en el sistema de autenticación');
        }

        // Create user in usuarios table
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            username,
            email,
            password_hash: '', // Password is managed by Supabase Auth
            role: formData.role,
            is_active: true,
            created_by: currentUser.id,
          });

        if (insertError) {
          // If usuarios insert fails, the auth user will need to be cleaned up manually
          // or we can try to delete it (requires admin privileges)
          if (insertError.code === '23505') {
            throw new Error('Este nombre de usuario ya está registrado');
          }
          console.error('Error inserting into usuarios table:', insertError);
          throw new Error(`Error al crear usuario en la base de datos: ${insertError.message}`);
        }

        // If role is docente, create entry in docentes table
        if (formData.role === 'docente') {
          const { error: docenteError } = await supabase
            .from('docentes')
            .insert({
              id_usuario: authData.user.id,
              nombres: username,
              apellidos: '',
              email: email || authEmail,
              activo: true,
            });

          if (docenteError) {
            console.warn('Warning: Could not create docente entry:', docenteError);
            // Don't fail the entire operation, just log the warning
          }
        }
      }

      await loadUsuarios();
      handleCloseModal();

      // Show success message
      if (!editingUser) {
        alert(`✅ Usuario "${username}" creado exitosamente con rol ${formData.role}`);
      } else {
        alert(`✅ Usuario "${username}" actualizado exitosamente`);
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el usuario ${username}?`)) {
      return;
    }

    try {
      // Delete from usuarios table (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Note: Deleting from Supabase Auth requires admin privileges
      // The auth user should be deleted manually from Supabase Dashboard
      // or through an Edge Function with admin access

      await loadUsuarios();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (updateError) throw updateError;
      await loadUsuarios();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      alert('Error al actualizar estado del usuario: ' + err.message);
    }
  };

  const filteredUsers = usuarios.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const roleLabels: Record<UserRole, string> = {
    docente: 'Docente',
    coordinador: 'Coordinador',
    directivo: 'Directivo',
    administrativo: 'Administrativo',
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'directivo': return 'default';
      case 'coordinador': return 'secondary';
      case 'docente': return 'outline';
      case 'administrativo': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Usuarios Autorizados</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona quién puede acceder al sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Buscar por usuario o correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{user.username}</p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(user.created_at).toLocaleDateString('es-VE')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {roleLabels[user.role]}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(user)}
                        className="flex-1"
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id, user.username)}
                        className="flex-1"
                      >
                        <DeleteIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Correo</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha de Registro</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">{user.username}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString('es-VE')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(user)}
                            title="Editar"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id, user.username)}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Total: {filteredUsers.length} usuario(s) autorizado(s)
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario *</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="nombreusuario"
                disabled={!!editingUser}
                required
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">El nombre de usuario no puede ser modificado</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
              <p className="text-xs text-muted-foreground">Si no se proporciona, se usará {formData.username || 'usuario'}@manglarnet.local</p>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Ingresa una contraseña segura"
                  required
                />
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docente">Docente</SelectItem>
                  <SelectItem value="coordinador">Coordinador</SelectItem>
                  <SelectItem value="directivo">Directivo</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
