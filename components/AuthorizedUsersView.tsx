import React, { useState, useEffect } from 'react';
import { supabase, AuthorizedUser } from '../services/supabaseClient';
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

interface AuthorizedUsersViewProps {
  currentUser: { id: string; email: string; role: string };
}

export const AuthorizedUsersView: React.FC<AuthorizedUsersViewProps> = ({ currentUser }) => {
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);
  const [formData, setFormData] = useState({ email: '', role: 'docente' as AuthorizedUser['role'] });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuthorizedUsers();
  }, []);

  const loadAuthorizedUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('authorized_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAuthorizedUsers(data || []);
    } catch (err: any) {
      console.error('Error loading authorized users:', err);
      setError('Error al cargar usuarios autorizados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: AuthorizedUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ email: '', role: 'docente' });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ email: '', role: 'docente' });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    try {
      setError(null);
      const email = formData.email.toLowerCase().trim();

      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('authorized_users')
          .update({ email, role: formData.role })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
      } else {
        // Insert new user
        const { error: insertError } = await supabase
          .from('authorized_users')
          .insert({
            email,
            role: formData.role,
            created_by: currentUser.id,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Este correo electrónico ya está registrado');
          }
          throw insertError;
        }
      }

      await loadAuthorizedUsers();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el acceso de ${userEmail}?`)) {
      return;
    }
    // TODO: Reemplazar con Dialog de confirmación más adelante

    try {
      const { error: deleteError } = await supabase
        .from('authorized_users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;
      await loadAuthorizedUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  const filteredUsers = authorizedUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<AuthorizedUser['role'], string> = {
    docente: 'Docente',
    coordinador: 'Coordinador',
    directivo: 'Directivo',
    administrativo: 'Administrativo',
  };

  const getRoleBadgeVariant = (role: AuthorizedUser['role']): "default" | "secondary" | "destructive" | "outline" => {
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
              placeholder="Buscar por correo electrónico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios autorizados'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(user.created_at).toLocaleDateString('es-VE')}
                        </p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {roleLabels[user.role]}
                      </Badge>
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
                        onClick={() => handleDelete(user.id, user.email)}
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
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Correo Electrónico</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha de Registro</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios autorizados'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
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
                            onClick={() => handleDelete(user.id, user.email)}
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
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                disabled={!!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">El correo no puede ser modificado</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as AuthorizedUser['role'] })}
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
