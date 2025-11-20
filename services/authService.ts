import { supabase } from './supabaseClient';

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: 'docente' | 'coordinador' | 'directivo';
  permissions: string[];
  is_active: boolean;
}

export interface LoginCredentials {
  identifier: string; // username or email
  password: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  role: 'docente' | 'coordinador' | 'directivo';
}

// ============================================
// Authentication Service
// ============================================

export const authService = {
  /**
   * Login with username or email
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const { identifier, password } = credentials;

    // Determine if identifier is email or username
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier : `${identifier}@manglarnet.local`;

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Credenciales inválidas');
      }

      if (!authData.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      // 2. Get user profile with permissions
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_with_permissions', { p_user_id: authData.user.id })
        .single();

      if (userError) {
        console.error('User profile error:', userError);
        throw new Error('Error al obtener perfil de usuario');
      }

      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      if (!userData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Usuario inactivo. Contacta al administrador.');
      }

      // 3. Update last login timestamp
      await supabase.rpc('update_last_login', { p_user_id: userData.id });

      return userData as User;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw new Error('Error al cerrar sesión');
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<User | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return null;
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_with_permissions', { p_user_id: session.user.id })
        .single();

      if (userError || !userData || !userData.is_active) {
        return null;
      }

      return userData as User;
    } catch (error) {
      console.error('Session error:', error);
      return null;
    }
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        throw new Error('Error al crear usuario en autenticación');
      }

      // 2. Create user profile in usuarios table
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .insert([{
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          telefono: userData.telefono,
          role: userData.role,
          is_active: true,
          email_verified: true,
        }])
        .select()
        .single();

      if (profileError) {
        // Rollback: delete auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Error al crear perfil de usuario');
      }

      // 3. Get user with permissions
      const { data: userWithPermissions } = await supabase
        .rpc('get_user_with_permissions', { p_user_id: authData.user.id })
        .single();

      return userWithPermissions as User;
    } catch (error: any) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Error al actualizar usuario');
    }

    // Get updated user with permissions
    const { data: userWithPermissions } = await supabase
      .rpc('get_user_with_permissions', { p_user_id: userId })
      .single();

    return userWithPermissions as User;
  },

  /**
   * Check if user has specific permission
   */
  hasPermission(user: User | null, permission: string): boolean {
    if (!user || !user.is_active) return false;
    return user.permissions.includes(permission);
  },

  /**
   * Check if user has any of the specified roles
   */
  hasRole(user: User | null, roles: string[]): boolean {
    if (!user || !user.is_active) return false;
    return roles.includes(user.role);
  },

  /**
   * Check if user is admin (directivo or super_admin)
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, ['directivo', 'super_admin']);
  },

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('apellidos', { ascending: true });

    if (error) {
      throw new Error('Error al obtener usuarios');
    }

    // Get each user with permissions
    const usersWithPermissions = await Promise.all(
      (data || []).map(async (user) => {
        const { data: userWithPerms } = await supabase
          .rpc('get_user_with_permissions', { p_user_id: user.id })
          .single();
        return userWithPerms;
      })
    );

    return usersWithPermissions.filter(Boolean) as User[];
  },

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      throw new Error('Error al desactivar usuario');
    }
  },

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ is_active: true })
      .eq('id', userId);

    if (error) {
      throw new Error('Error al activar usuario');
    }
  },

  /**
   * Change user password (admin only)
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error('Error al cambiar contraseña');
    }
  },
};
