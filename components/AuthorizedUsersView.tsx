import React, { useState, useEffect } from 'react';
import { supabase, AuthorizedUser } from '../services/supabaseClient';
import { PlusIcon, EditIcon, DeleteIcon, CloseIcon } from './Icons';

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

  const roleColors: Record<AuthorizedUser['role'], string> = {
    docente: 'bg-blue-100 text-blue-800',
    coordinador: 'bg-purple-100 text-purple-800',
    directivo: 'bg-green-100 text-green-800',
    administrativo: 'bg-gray-100 text-gray-800',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuarios Autorizados</h2>
          <p className="text-gray-600 mt-1">Gestiona quién puede acceder al sistema</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <PlusIcon />
          Agregar Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Correo Electrónico</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha de Registro</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios autorizados'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString('es-VE')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Total: {filteredUsers.length} usuario(s) autorizado(s)
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="usuario@ejemplo.com"
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500">El correo no puede ser modificado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AuthorizedUser['role'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="docente">Docente</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="directivo">Directivo</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

