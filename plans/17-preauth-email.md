# Plan 17: Pre-Authorized Email Authentication

## Overview

Implement email-based pre-authorization for OAuth sign-in. Users must be pre-registered in the database before they can authenticate via Google/GitHub. Includes admin UI for managing authorized users.

## Requirements

1. **Pre-Authorization**: Only emails already in the User table can sign in
2. **OAuth Validation**: Check email exists before allowing OAuth sign-in
3. **New Roles**: admin, sa (Solution Architect), reader
4. **Admin UI**: Manage authorized users at `/admin/users`

## Tasks

### 1. Update Prisma Schema

**File**: `prisma/schema.prisma`

Add fields to User model:
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("reader")  // Changed from "user"
  isActive      Boolean   @default(true)      // NEW
  createdBy     String?                       // NEW: Admin who authorized
  lastLoginAt   DateTime?                     // NEW
  createdAt     DateTime  @default(now())     // NEW
  accounts      Account[]
  sessions      Session[]
}
```

Run migration: `npx prisma migrate dev --name add_user_preauth_fields`

### 2. Update Auth Configuration

**File**: `src/lib/auth.ts`

Add `signIn` callback to validate pre-authorization:
```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Skip for credentials (handled in authorize)
    if (account?.provider === 'credentials') return true;

    const email = (user.email || profile?.email)?.toLowerCase();
    if (!email) return false;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return '/auth/error?error=NotAuthorized';
    }
    if (!existingUser.isActive) {
      return '/auth/error?error=AccountDisabled';
    }

    // Update last login
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { lastLoginAt: new Date() },
    });

    return true;
  },
  // ... existing jwt and session callbacks
}
```

Update role type and utilities:
```typescript
export type UserRole = 'admin' | 'sa' | 'reader';

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}
// Update other role functions to use new role names
```

Update dev credentials provider to check pre-authorization.

### 3. Update Error Page

**File**: `src/app/auth/error/page.tsx`

Add new error messages:
```typescript
const errorMessages = {
  // ... existing
  NotAuthorized: 'Your email is not authorized. Contact an administrator.',
  AccountDisabled: 'Your account has been disabled. Contact an administrator.',
};
```

### 4. Create Users API

**File**: `src/app/api/users/route.ts`

```typescript
// GET /api/users - List all users (admin only)
// POST /api/users - Pre-authorize new user (admin only)
//   Body: { email, name?, role: 'admin' | 'sa' | 'reader' }
```

**File**: `src/app/api/users/[id]/route.ts`

```typescript
// GET /api/users/[id] - Get user details
// PATCH /api/users/[id] - Update user (role, isActive, name)
// DELETE /api/users/[id] - Remove user
```

### 5. Create Admin UI

**File**: `src/app/admin/users/page.tsx`

User management page with:
- Table: email, name, role, status, last login
- Search/filter by email or role
- "Add User" dialog to pre-authorize new email
- Edit role, toggle active status
- Delete with confirmation

**File**: `src/components/admin/UserDialog.tsx`

Dialog for adding/editing users.

### 6. Update Middleware

**File**: `src/middleware.ts`

Add protection for `/admin/users`:
```typescript
if (path.startsWith('/admin/users')) {
  if (token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
}
```

Update role checks from 'viewer' to 'reader'.

### 7. Update Sign-In Page

**File**: `src/app/auth/signin/page.tsx`

- Update role selector: Administrator, Solution Architect, Reader
- Add info text: "Only pre-authorized users can sign in"

### 8. Update Admin Dashboard

**File**: `src/app/admin/page.tsx`

Add User Management card linking to `/admin/users`.

### 9. Data Migration

**File**: `prisma/migrations/migrate-users.ts`

```typescript
// Set all existing users to isActive: true
// Map: user → sa, viewer → reader
// Warn if no admin exists
```

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add isActive, createdBy, lastLoginAt, createdAt |
| `src/lib/auth.ts` | Add signIn callback, update roles |
| `src/types/next-auth.d.ts` | Update role types |
| `src/middleware.ts` | Add /admin/users, update role names |
| `src/app/auth/error/page.tsx` | Add NotAuthorized, AccountDisabled errors |
| `src/app/auth/signin/page.tsx` | Update role options |
| `src/app/admin/page.tsx` | Add User Management card |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/users/route.ts` | List/create users API |
| `src/app/api/users/[id]/route.ts` | Get/update/delete user API |
| `src/app/admin/users/page.tsx` | User management page |
| `src/components/admin/UserDialog.tsx` | Add/edit user dialog |
| `prisma/migrations/migrate-users.ts` | Data migration script |

## Verification

1. **Unauthorized User Test**:
   - Sign out, try Google/GitHub with non-registered email
   - Should see "not authorized" error

2. **Pre-authorized User Test**:
   - Add user via admin UI
   - Sign in with that email via OAuth
   - Should succeed with correct role

3. **Disabled User Test**:
   - Disable a user in admin UI
   - Try to sign in with that email
   - Should see "account disabled" error

4. **Admin UI Test**:
   - Navigate to /admin/users as admin
   - Add, edit, disable users
   - Non-admins should be blocked

5. **Role Enforcement**:
   - SA can create assessments, cannot access /admin/users
   - Reader can only view, cannot create assessments
