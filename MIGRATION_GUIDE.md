# Authentication System Migration Guide

## Overview

This guide will help you migrate from the old dual authentication system to the new unified system.

---

## Prerequisites

✅ **Before you begin:**
1. **Backup your database** - Critical!
2. Have access to Supabase Dashboard
3. Have a list of current users who need access
4. Plan a maintenance window (15-30 minutes)

---

## Migration Steps

### Step 1: Run the Main Migration

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `supabase/migrations/030_unified_auth_system.sql`
4. Copy and paste the entire content
5. Click **Run**

**Expected result:** New `usuarios` table created, RLS policies updated

---

### Step 2: Create Your First Admin User

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication > Users**
2. Click **Add User**
3. Fill in:
   - Email: `admin@manglarnet.local`
   - Password: [Choose a strong password]
   - Auto Confirm Email: ✅ **YES**
4. Click **Create User**
5. **Copy the User ID** (you'll need it next)

6. Go back to **SQL Editor**
7. Run this query (replace `USER_ID_HERE` with the actual ID):

```sql
INSERT INTO usuarios (
  id,
  username,
  email,
  nombres,
  apellidos,
  role,
  is_active,
  email_verified
) VALUES (
  'USER_ID_HERE'::uuid,
  'admin',
  'admin@manglarnet.local',
  'Administrador',
  'Sistema',
  'super_admin',
  TRUE,
  TRUE
);
```

#### Option B: Use the Setup Script

1. Open `supabase/migrations/031_setup_admin_user.sql`
2. Follow the instructions in the file
3. Run each step sequentially

---

### Step 3: Verify the Migration

Run these verification queries:

```sql
-- Check if admin user exists
SELECT * FROM usuarios WHERE username = 'admin';

-- Check if permissions are loaded
SELECT * FROM role_permissions;

-- Test the auth function
SELECT * FROM get_user_with_permissions(
  (SELECT id FROM usuarios WHERE username = 'admin')
);
```

**Expected results:**
- Admin user found ✅
- 4 roles with permissions ✅
- User data returned with permissions array ✅

---

### Step 4: Test Login

1. Open your application
2. Try logging in with:
   - Username: `admin`
   - Password: [the password you set]

**Expected result:** Successful login, redirected to dashboard

---

### Step 5: Create Additional Users

#### For Each User:

1. **Create in Supabase Auth:**
   - Go to Authentication > Users > Add User
   - Email: `username@manglarnet.local` (or real email)
   - Password: [temporary password]
   - Auto Confirm: YES

2. **Add to usuarios table:**

```sql
INSERT INTO usuarios (
  id,
  username,
  email,
  nombres,
  apellidos,
  role,
  is_active,
  email_verified
) VALUES (
  'USER_ID_FROM_AUTH'::uuid,
  'username_here',
  'email@manglarnet.local',
  'Nombre',
  'Apellido',
  'docente',  -- or 'coordinador', 'directivo'
  TRUE,
  TRUE
);
```

---

### Step 6: Migrate Existing Users (Optional)

If you have users in the old `authorized_users` table:

```sql
-- First, ensure they exist in auth.users
-- Then run:
INSERT INTO usuarios (
  id,
  username,
  email,
  nombres,
  apellidos,
  role,
  is_active,
  email_verified
)
SELECT 
  au.id,
  COALESCE(au.username, SPLIT_PART(au.email, '@', 1)),
  au.email,
  'Usuario',  -- Update manually later
  'Pendiente',
  au.role,
  TRUE,
  TRUE
FROM authorized_users au
WHERE au.id IN (SELECT id FROM auth.users)
ON CONFLICT (id) DO NOTHING;

-- Then update names manually:
UPDATE usuarios 
SET nombres = 'Nombre Real', apellidos = 'Apellido Real'
WHERE username = 'username';
```

---

### Step 7: Update Frontend (If Needed)

The new `LoginScreen.tsx` is already updated. If you have custom components:

1. Replace imports:
```typescript
// Old
import { supabase } from '../services/supabaseClient';

// New
import { authService, User } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
```

2. Update login logic:
```typescript
// Old
const { data, error } = await supabase.auth.signInWithPassword({...});

// New
const user = await authService.login({ identifier, password });
```

3. Use the hook:
```typescript
const { user, hasPermission, hasRole } = useAuth();

// Check permissions
if (hasPermission('students.edit')) {
  // Show edit button
}
```

---

## Troubleshooting

### Issue: "User not found in database"

**Solution:**
1. Check if user exists in `auth.users`:
```sql
SELECT * FROM auth.users WHERE email = 'user@email.com';
```

2. If yes, add to `usuarios` table (see Step 5)
3. If no, create user in Supabase Auth first

---

### Issue: "Permission denied" or RLS errors

**Solution:**
1. Verify RLS policies were created:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

2. Check if helper functions exist:
```sql
SELECT * FROM pg_proc WHERE proname LIKE 'auth%';
```

3. Re-run the migration if needed

---

### Issue: Login works but no permissions

**Solution:**
1. Check role_permissions table:
```sql
SELECT * FROM role_permissions WHERE role = 'docente';
```

2. Verify user's role:
```sql
SELECT role FROM usuarios WHERE username = 'username';
```

3. Test the function:
```sql
SELECT * FROM get_user_with_permissions('USER_ID'::uuid);
```

---

## Rollback Plan

If you need to rollback:

1. **Restore from backup:**
```bash
# Use your database backup
pg_restore -d manglarnet backup_file.sql
```

2. **Or manually revert:**
```sql
-- Disable new RLS policies
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Re-enable old system (if you kept authorized_users)
-- ... restore old policies ...
```

---

## Post-Migration Checklist

- [ ] Admin user can login
- [ ] All existing users migrated
- [ ] Permissions working correctly
- [ ] All components accessible based on roles
- [ ] Old `authorized_users` table backed up
- [ ] Documentation updated
- [ ] Team notified of new login process

---

## User Roles & Permissions

### Docente (Teacher)
- View students, teachers, classes
- Create/edit own lesson plans
- View schedules
- Create evaluations
- View calendar

### Coordinador (Coordinator)
- All docente permissions
- Edit students and classes
- Approve lesson plans
- Create/edit schedules
- Manage calendar events

### Directivo (Director)
- All coordinador permissions
- Full CRUD on students, teachers, classes
- Manage users (create, edit)
- Delete evaluations

### Super Admin
- All permissions
- Delete users
- System administration

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: Dashboard > Logs
3. Check browser console for errors
4. Verify database state with SQL queries

---

## Next Steps

After successful migration:

1. **Delete old table** (after confirming everything works):
```sql
DROP TABLE IF EXISTS authorized_users CASCADE;
```

2. **Update documentation** for your team
3. **Train users** on new login process (username or email)
4. **Set up password reset** flow (optional)
5. **Enable 2FA** for admin users (optional)
