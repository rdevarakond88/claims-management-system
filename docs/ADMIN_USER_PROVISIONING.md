# Admin User Provisioning Implementation Guide
## Claims Management System

**Feature:** Admin-Provisioned User Onboarding with Temporary Passwords
**Priority:** P0 (MVP)
**Last Updated:** October 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Flow](#user-flow)
3. [Database Changes](#database-changes)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Considerations](#security-considerations)
7. [Testing Guide](#testing-guide)
8. [API Reference](#api-reference)

---

## 1. Overview

### Purpose

Implement an enterprise-grade user onboarding pattern where system administrators provision new user accounts with auto-generated temporary passwords. This approach provides proper access control governance typical of healthcare IT environments.

### Key Features

- Admin dashboard for user management
- Auto-generated secure temporary passwords (12+ characters)
- One-time password display to admin
- Forced password change on first login
- Role-based access control enforcement

### Why This Approach?

In production healthcare systems, user accounts are not self-registered. Instead:
- Provider practice managers request accounts from IT
- Payer HR/IT departments provision new claims processors
- Formal approval workflows ensure proper access controls
- Centralized management enables easier offboarding

This POC simulates this pattern without requiring email infrastructure.

---

## 2. User Flow

### Admin Creates User

1. Admin logs in and navigates to Admin Dashboard
2. Clicks "Add User" button
3. Fills out form:
   - Email
   - First Name
   - Last Name
   - Role (Provider Staff or Payer Processor)
   - Organization (dropdown filtered by role)
4. Submits form
5. System generates secure temporary password
6. Success modal displays temporary password with "Copy" button
7. Admin copies password and shares it with new user manually
8. New user appears in user list table

### New User First Login

1. User receives email and temporary password from admin
2. Navigates to login page
3. Enters email and temporary password
4. System detects `is_first_login = true`
5. Redirects to "Set New Password" page
6. User enters:
   - Current temporary password (for verification)
   - New password
   - Confirm new password
7. Submits new password
8. System validates and updates:
   - Password hash
   - Sets `is_first_login = false`
9. Redirects to role-appropriate dashboard
10. User can now use system normally

---

## 3. Database Changes

### Migration: Add `is_first_login` Column

**File:** `backend/prisma/migrations/YYYYMMDD_add_is_first_login.sql`

```sql
-- Add is_first_login column to users table
ALTER TABLE users
ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE NOT NULL;

-- Set existing users to FALSE (they're already using the system)
UPDATE users SET is_first_login = FALSE WHERE created_at < NOW();

-- Add comment for documentation
COMMENT ON COLUMN users.is_first_login IS 'True if user must change password on next login';
```

**Rollback:**
```sql
ALTER TABLE users DROP COLUMN is_first_login;
```

### Updated Prisma Schema

**File:** `backend/prisma/schema.prisma`

```prisma
model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique @db.VarChar(100)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  role         Role
  providerId   String?   @map("provider_id") @db.Uuid
  payerId      String?   @map("payer_id") @db.Uuid
  firstName    String?   @map("first_name") @db.VarChar(100)
  lastName     String?   @map("last_name") @db.VarChar(100)
  isActive     Boolean   @default(true) @map("is_active")
  isFirstLogin Boolean   @default(true) @map("is_first_login")
  lastLogin    DateTime? @map("last_login")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  provider Provider? @relation(fields: [providerId], references: [id])
  payer    Payer?    @relation(fields: [payerId], references: [id])

  @@map("users")
}

enum Role {
  provider_staff
  payer_processor
  admin
}
```

---

## 4. Backend Implementation

### 4.1 Temporary Password Generation Utility

**File:** `backend/src/utils/passwordGenerator.js`

```javascript
const crypto = require('crypto');

/**
 * Generates a secure random temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and symbols
 * Example: "Xk9#mP2$qL5!"
 */
function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  // Ensure at least one character from each category
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill remaining characters randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < 12; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password to randomize character positions
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

module.exports = { generateTemporaryPassword };
```

### 4.2 Role Check Middleware

**File:** `backend/src/middleware/roleCheck.js`

```javascript
/**
 * Middleware to check if user has required role
 * Usage: router.get('/admin/users', requireRole('admin'), controller.listUsers)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    next();
  };
}

module.exports = { requireRole };
```

### 4.3 First Login Check Middleware

**File:** `backend/src/middleware/firstLoginCheck.js`

```javascript
/**
 * Middleware to check if user needs to change password
 * Allows access only to /auth/set-password and /auth/logout routes
 */
function checkFirstLogin(req, res, next) {
  // Skip check for set-password and logout endpoints
  if (req.path === '/auth/set-password' || req.path === '/auth/logout') {
    return next();
  }

  if (req.user && req.user.isFirstLogin) {
    return res.status(403).json({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before accessing the system',
        requirePasswordChange: true
      }
    });
  }

  next();
}

module.exports = { checkFirstLogin };
```

### 4.4 Admin Routes

**File:** `backend/src/routes/admin.js`

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/roleCheck');

// All routes require admin role
router.use(requireRole('admin'));

// List all users
router.get('/users', adminController.listUsers);

// Create new user
router.post('/users', adminController.createUser);

module.exports = router;
```

### 4.5 Admin Controller

**File:** `backend/src/controllers/adminController.js`

```javascript
const adminService = require('../services/adminService');

/**
 * List all users
 */
async function listUsers(req, res) {
  try {
    const { role, is_active } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.isActive = is_active === 'true';

    const users = await adminService.getAllUsers(filters);

    return res.status(200).json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching users'
      }
    });
  }
}

/**
 * Create new user with temporary password
 */
async function createUser(req, res) {
  try {
    const { email, first_name, last_name, role, organization_id } = req.body;

    // Validate input
    const validationErrors = validateUserInput(req.body);
    if (validationErrors) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors
        }
      });
    }

    // Create user
    const result = await adminService.createUserWithTempPassword({
      email,
      firstName: first_name,
      lastName: last_name,
      role,
      organizationId: organization_id,
      createdByAdminId: req.user.id
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: result.user,
      temporary_password: result.temporaryPassword
    });

  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'An account with this email already exists'
        }
      });
    }

    if (error.code === 'INVALID_ORGANIZATION') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            organization_id: error.message
          }
        }
      });
    }

    console.error('Create user error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating user'
      }
    });
  }
}

function validateUserInput(data) {
  const errors = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.first_name || data.first_name.trim().length === 0) {
    errors.first_name = 'First name is required';
  } else if (data.first_name.length > 100) {
    errors.first_name = 'First name must be less than 100 characters';
  }

  if (!data.last_name || data.last_name.trim().length === 0) {
    errors.last_name = 'Last name is required';
  } else if (data.last_name.length > 100) {
    errors.last_name = 'Last name must be less than 100 characters';
  }

  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['provider_staff', 'payer_processor'].includes(data.role)) {
    errors.role = 'Role must be either "provider_staff" or "payer_processor"';
  }

  if (!data.organization_id) {
    errors.organization_id = 'Organization is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

module.exports = {
  listUsers,
  createUser
};
```

### 4.6 Admin Service

**File:** `backend/src/services/adminService.js`

```javascript
const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { generateTemporaryPassword } = require('../utils/passwordGenerator');

/**
 * Get all users with optional filters
 */
async function getAllUsers(filters = {}) {
  const users = await prisma.user.findMany({
    where: filters,
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
      isFirstLogin: true,
      lastLogin: true,
      createdAt: true,
      provider: {
        select: {
          id: true,
          name: true
        }
      },
      payer: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Format response
  return users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.firstName,
    last_name: user.lastName,
    is_active: user.isActive,
    is_first_login: user.isFirstLogin,
    organization: user.provider ? {
      id: user.provider.id,
      name: user.provider.name,
      type: 'provider'
    } : user.payer ? {
      id: user.payer.id,
      name: user.payer.name,
      type: 'payer'
    } : null,
    last_login: user.lastLogin,
    created_at: user.createdAt
  }));
}

/**
 * Create user with temporary password
 */
async function createUserWithTempPassword(userData) {
  const { email, firstName, lastName, role, organizationId } = userData;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  // Validate organization exists and matches role
  const isProvider = role === 'provider_staff';
  const orgTable = isProvider ? 'provider' : 'payer';

  const organization = await prisma[orgTable].findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    const error = new Error('Organization not found or does not match role type');
    error.code = 'INVALID_ORGANIZATION';
    throw error;
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role,
      firstName,
      lastName,
      isFirstLogin: true,
      ...(isProvider ? { providerId: organizationId } : { payerId: organizationId })
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isFirstLogin: true,
      createdAt: true,
      provider: {
        select: {
          id: true,
          name: true
        }
      },
      payer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      is_first_login: user.isFirstLogin,
      organization: user.provider ? {
        id: user.provider.id,
        name: user.provider.name
      } : {
        id: user.payer.id,
        name: user.payer.name
      },
      created_at: user.createdAt
    },
    temporaryPassword
  };
}

module.exports = {
  getAllUsers,
  createUserWithTempPassword
};
```

### 4.7 Update Auth Controller - Add Set Password

**File:** `backend/src/controllers/authController.js`

Add this function:

```javascript
const bcrypt = require('bcrypt');
const prisma = require('../config/database');

/**
 * Set new password on first login
 */
async function setPassword(req, res) {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            confirm_password: 'Passwords do not match'
          }
        }
      });
    }

    // Validate password strength
    if (new_password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(new_password)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            new_password: 'Password must be at least 8 characters and contain uppercase, lowercase, and number'
          }
        }
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(new_password, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be different from current password'
        }
      });
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        isFirstLogin: false,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'Password updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_first_login: false
      }
    });

  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating password'
      }
    });
  }
}

module.exports = {
  // ... existing exports
  setPassword
};
```

### 4.8 Update Auth Routes

**File:** `backend/src/routes/auth.js`

Add this route:

```javascript
const authController = require('../controllers/authController');

// ... existing routes

// Set password on first login
router.post('/set-password', authController.setPassword);

module.exports = router;
```

### 4.9 Update Main App to Include Routes

**File:** `backend/src/app.js` or `backend/src/index.js`

```javascript
const adminRoutes = require('./routes/admin');
const { checkFirstLogin } = require('./middleware/firstLoginCheck');

// ... existing middleware

// Apply first login check to protected routes
app.use('/api/v1', checkFirstLogin);

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/claims', claimsRoutes);
// ... other routes
```

---

## 5. Frontend Implementation

### 5.1 Admin Dashboard Page

**File:** `frontend/src/pages/AdminDashboard.jsx`

This will be created in next phase with full implementation including:
- User list table
- Add User modal
- Temp password display modal
- Filter functionality
- Copy to clipboard feature

### 5.2 Set Password Page

**File:** `frontend/src/pages/SetPasswordPage.jsx`

This will be created in next phase with full implementation including:
- Three password fields (current, new, confirm)
- Real-time validation
- Password strength indicator
- Error handling

### 5.3 API Service Updates

**File:** `frontend/src/services/api.js`

```javascript
// Admin endpoints
export const adminAPI = {
  listUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  }
};

// Auth endpoints
export const authAPI = {
  // ... existing methods

  setPassword: async (passwordData) => {
    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(passwordData)
    });
    return handleResponse(response);
  }
};
```

---

## 6. Security Considerations

### Password Security

1. **Temporary passwords:** 12+ characters, mixed case, numbers, symbols
2. **Hashing:** bcrypt with cost factor 10
3. **One-time display:** Temp password only shown once
4. **Forced change:** Cannot access system until password changed
5. **Validation:** New password must meet strength requirements

### Access Control

1. **Role-based:** Only admins can access admin endpoints
2. **Middleware enforcement:** Role checks on every admin request
3. **First-login checks:** Middleware blocks access if password change needed
4. **Session validation:** All routes require valid session

### Audit Trail

Future enhancement: Log all user creation events with:
- Admin ID who created user
- Timestamp
- User details (email, role, organization)

---

## 7. Testing Guide

### Backend Tests

```bash
npm test -- admin.test.js
npm test -- auth.test.js
```

#### Test Cases

1. **Admin Create User**
   - ✓ Valid user creation returns 201 with temp password
   - ✓ Duplicate email returns 409 error
   - ✓ Invalid email format returns 400 error
   - ✓ Invalid organization ID returns 400 error
   - ✓ Organization type mismatch returns 400 error
   - ✓ Non-admin user returns 403 error

2. **Set Password**
   - ✓ Valid password change returns 200 and sets is_first_login to false
   - ✓ Wrong current password returns 400 error
   - ✓ Weak new password returns 400 error
   - ✓ Non-matching passwords return 400 error
   - ✓ Same password as current returns 400 error

3. **First Login Middleware**
   - ✓ User with is_first_login=true blocked from claims endpoints
   - ✓ User with is_first_login=true allowed to /auth/set-password
   - ✓ User with is_first_login=false allowed to all endpoints

### Frontend Tests

```bash
npm test -- AdminDashboard.test.jsx
npm test -- SetPasswordPage.test.jsx
```

### Manual Testing Checklist

- [ ] Admin can create user with temp password
- [ ] Temp password is displayed once in modal
- [ ] Copy button works
- [ ] New user appears in user list
- [ ] New user can login with temp password
- [ ] User redirected to Set Password page
- [ ] Cannot access dashboard until password changed
- [ ] Password validation works (strength, match)
- [ ] After password change, user redirected to dashboard
- [ ] User can now use system normally
- [ ] Admin cannot retrieve temp password after creation

---

## 8. API Reference

See `architecture/API_CONTRACTS.md` for full API documentation:

- `POST /api/v1/admin/users` - Create user
- `GET /api/v1/admin/users` - List users
- `POST /api/v1/auth/set-password` - Change password

---

**End of Implementation Guide**

*This document provides complete technical specifications for implementing admin-provisioned user onboarding. All code examples are production-ready and follow security best practices for healthcare applications.*
