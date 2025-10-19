# Admin User Provisioning - Implementation Checklist

**Feature:** Admin-Provisioned User Onboarding with Temporary Passwords
**Status:** Foundation Complete - Implementation Pending
**Last Updated:** October 2025

---

## ✅ Phase 1: Documentation (COMPLETE)

- [x] Updated USER_STORIES.md - US-011 moved to P0
- [x] Updated API_CONTRACTS.md - Added admin endpoints
- [x] Updated PRD.md - Added admin provisioning to FR-1
- [x] Updated DATA_MODEL.md - Documented is_first_login field
- [x] Updated README.md - Added admin workflows
- [x] Created ADMIN_USER_PROVISIONING.md - Implementation guide

## ✅ Phase 2: Database Migration (COMPLETE)

- [x] Added is_first_login column to users table
- [x] Updated existing users to is_first_login = FALSE
- [x] Updated Prisma schema
- [x] Generated Prisma client

## ✅ Phase 3: Backend Infrastructure (COMPLETE)

- [x] Created passwordGenerator.js utility
- [x] Created roleCheck.js middleware
- [x] Created firstLoginCheck.js middleware

---

## 🚧 Phase 4: Backend Implementation (PENDING)

### Admin Routes & Controllers

- [ ] **backend/src/routes/admin.routes.js**
  - [ ] POST /api/v1/admin/users - Create user
  - [ ] GET /api/v1/admin/users - List users
  - [ ] Apply requireRole('admin') middleware

- [ ] **backend/src/controllers/admin.controller.js**
  - [ ] createUser() - Handle user creation
  - [ ] listUsers() - Handle user listing with filters
  - [ ] Validation logic for user input
  - [ ] Error handling (duplicate email, invalid org, etc.)

- [ ] **backend/src/services/admin.service.js**
  - [ ] createUserWithTempPassword() - Core user creation logic
  - [ ] getAllUsers() - Query users with filters
  - [ ] Integration with passwordGenerator
  - [ ] Organization validation (provider/payer match)

### Auth Updates

- [ ] **backend/src/routes/auth.routes.js**
  - [ ] Add POST /api/v1/auth/set-password route

- [ ] **backend/src/controllers/auth.controller.js**
  - [ ] setPassword() function
  - [ ] Validate current password
  - [ ] Validate new password strength
  - [ ] Update password hash
  - [ ] Set is_first_login = FALSE
  - [ ] Error handling

### App Integration

- [ ] **backend/src/app.js**
  - [ ] Import admin routes
  - [ ] Import firstLoginCheck middleware
  - [ ] Apply firstLoginCheck to protected routes
  - [ ] Register /api/v1/admin routes
  - [ ] Ensure proper middleware order

---

## 🎨 Phase 5: Frontend Implementation (PENDING)

### Admin Dashboard

- [ ] **frontend/src/pages/AdminDashboard.jsx**
  - [ ] User list table component
  - [ ] Table columns: Email, Name, Role, Organization, Status, Created Date
  - [ ] "Add User" button
  - [ ] Add User modal/form with fields:
    - [ ] Email (with validation)
    - [ ] First Name
    - [ ] Last Name
    - [ ] Role dropdown (Provider Staff / Payer Processor)
    - [ ] Organization dropdown (filtered by role)
  - [ ] Success modal showing temporary password
  - [ ] Copy to clipboard functionality
  - [ ] Warning message: "Save this password - it will not be shown again"
  - [ ] Filter functionality (by role, status)
  - [ ] Loading states
  - [ ] Error handling and display

### Set Password Page

- [ ] **frontend/src/pages/SetPasswordPage.jsx**
  - [ ] Form with three fields:
    - [ ] Current temporary password
    - [ ] New password
    - [ ] Confirm new password
  - [ ] Real-time validation:
    - [ ] Password strength indicator
    - [ ] Match confirmation
    - [ ] Min 8 chars, uppercase, lowercase, number
  - [ ] Submit button (disabled until valid)
  - [ ] Error display
  - [ ] Success handling with redirect
  - [ ] Loading state during API call

### App Routing & API

- [ ] **frontend/src/App.jsx**
  - [ ] Add /admin route (protected, admin-only)
  - [ ] Add /set-password route (protected, authenticated)
  - [ ] Handle first-login redirect logic
  - [ ] Role-based route protection

- [ ] **frontend/src/services/api.js**
  - [ ] adminAPI.createUser(userData)
  - [ ] adminAPI.listUsers(filters)
  - [ ] authAPI.setPassword(passwordData)
  - [ ] Error handling for 403 (PASSWORD_CHANGE_REQUIRED)

---

## 🧪 Phase 6: Testing (PENDING)

### Backend Tests

- [ ] Admin endpoints
  - [ ] Valid user creation returns 201 with temp password
  - [ ] Duplicate email returns 409 error
  - [ ] Invalid email format returns 400 error
  - [ ] Invalid organization ID returns 400 error
  - [ ] Organization type mismatch returns 400 error
  - [ ] Non-admin user returns 403 error
  - [ ] List users works with filters

- [ ] Set password endpoint
  - [ ] Valid password change returns 200 and sets is_first_login=false
  - [ ] Wrong current password returns 400 error
  - [ ] Weak new password returns 400 error
  - [ ] Non-matching passwords return 400 error
  - [ ] Same password as current returns 400 error

- [ ] Middleware
  - [ ] firstLoginCheck blocks access to claims when is_first_login=true
  - [ ] firstLoginCheck allows access to /auth/set-password
  - [ ] roleCheck blocks non-admin from admin routes

### Frontend Tests

- [ ] AdminDashboard component renders
- [ ] Add User modal opens and closes
- [ ] Form validation works
- [ ] Temp password modal displays correctly
- [ ] Copy button works
- [ ] SetPasswordPage renders
- [ ] Password validation works
- [ ] Form submission works

### Integration Tests

- [ ] **Full Admin Flow:**
  - [ ] Admin logs in
  - [ ] Navigates to admin dashboard
  - [ ] Creates new user
  - [ ] Temp password displayed
  - [ ] New user appears in list

- [ ] **Full First Login Flow:**
  - [ ] New user logs in with temp password
  - [ ] Redirected to Set Password page
  - [ ] Cannot access dashboard
  - [ ] Changes password successfully
  - [ ] Redirected to appropriate dashboard
  - [ ] Can now access system normally

---

## 📝 Implementation Notes

### Backend File Locations
```
backend/src/
├── routes/
│   ├── admin.routes.js          (NEW)
│   └── auth.routes.js           (UPDATE)
├── controllers/
│   ├── admin.controller.js      (NEW)
│   └── auth.controller.js       (UPDATE)
├── services/
│   └── admin.service.js         (NEW)
├── middleware/
│   ├── roleCheck.js             (DONE)
│   └── firstLoginCheck.js       (DONE)
├── utils/
│   └── passwordGenerator.js     (DONE)
└── app.js                       (UPDATE)
```

### Frontend File Locations
```
frontend/src/
├── pages/
│   ├── AdminDashboard.jsx       (NEW)
│   └── SetPasswordPage.jsx      (NEW)
├── services/
│   └── api.js                   (UPDATE)
└── App.jsx                      (UPDATE)
```

---

## 🎯 Estimated Time to Complete

- **Backend Implementation:** 3-4 hours
- **Frontend Implementation:** 4-5 hours
- **Testing & Debugging:** 1-2 hours
- **Total:** 8-11 hours

---

## 📚 Reference Documentation

- **Implementation Guide:** `docs/ADMIN_USER_PROVISIONING.md`
- **API Contracts:** `architecture/API_CONTRACTS.md`
- **User Stories:** `docs/USER_STORIES.md` (US-011)
- **Data Model:** `architecture/DATA_MODEL.md`

---

**Status:** Foundation complete, ready for implementation phase
**Next Step:** Start with backend routes, controllers, and services
