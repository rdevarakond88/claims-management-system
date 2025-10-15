# API Contracts Specification
## Claims Management System (CMS)

**Document Owner:** rdevarakond88  
**Last Updated:** October 2025  
**API Version:** v1  
**Base URL:** `http://localhost:3000/api/v1` (development)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [User Endpoints](#user-endpoints)
   - [Provider Endpoints](#provider-endpoints)
   - [Payer Endpoints](#payer-endpoints)
   - [Claims Endpoints](#claims-endpoints)
   - [Admin Endpoints](#admin-endpoints)

---

## 1. Overview

### API Style
- **REST** (Representational State Transfer)
- **JSON** for all request/response bodies
- **HTTP methods** follow REST conventions:
  - `GET` — Retrieve resources (idempotent)
  - `POST` — Create new resources
  - `PATCH` — Partial update of resources
  - `DELETE` — Remove resources (not used in MVP)

### Versioning
- API version in URL path: `/api/v1/...`
- Allows future breaking changes without disrupting existing clients

### Content Type
- All requests with body must include: `Content-Type: application/json`
- All responses return: `Content-Type: application/json`

---

## 2. Authentication

### Session-Based Authentication

**Flow:**
1. User POSTs credentials to `/api/v1/auth/login`
2. Server validates, creates session, returns session cookie
3. Client includes cookie in all subsequent requests
4. Server validates session on each request

### Session Cookie
- **Name:** `cms_session`
- **HttpOnly:** true (prevents XSS attacks)
- **Secure:** true (HTTPS only in production)
- **SameSite:** Strict
- **Max Age:** 30 minutes (auto-refresh on activity)

### Protected Endpoints
All endpoints except `/auth/login` and `/auth/logout` require valid session.

**Unauthorized Response (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

---

## 3. Common Patterns

### Pagination (Future Enhancement)
```
GET /api/v1/claims?page=1&limit=20
```

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Filtering
```
GET /api/v1/claims?status=submitted&from_date=2025-10-01
```

### Sorting
```
GET /api/v1/claims?sort_by=submitted_at&sort_order=desc
```

### Timestamps
- All timestamps in **ISO 8601 format with timezone**
- Example: `2025-10-15T14:30:00Z`

### UUIDs
- All resource IDs are UUID v4
- Example: `550e8400-e29b-41d4-a716-446655440000`

---

## 4. Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error (optional)"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Codes

- `VALIDATION_ERROR` — Invalid input data
- `UNAUTHORIZED` — Not logged in
- `FORBIDDEN` — Insufficient permissions
- `NOT_FOUND` — Resource not found
- `DUPLICATE_RESOURCE` — Resource already exists
- `INTERNAL_ERROR` — Server error

---

## 5. Endpoints

---

## Auth Endpoints

### POST `/api/v1/auth/login`

Authenticate user and create session.

**Request:**
```json
{
  "email": "sarah.jones@lpcc.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "sarah.jones@lpcc.com",
    "role": "provider_staff",
    "first_name": "Sarah",
    "last_name": "Jones",
    "provider": {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Louisville Primary Care Clinic"
    }
  },
  "session_expires_at": "2025-10-15T15:00:00Z"
}
```

**Error Response (401):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### POST `/api/v1/auth/logout`

Destroy current session.

**Request:** (no body, session cookie required)

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET `/api/v1/auth/me`

Get current authenticated user info.

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "sarah.jones@lpcc.com",
    "role": "provider_staff",
    "first_name": "Sarah",
    "last_name": "Jones",
    "provider": {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Louisville Primary Care Clinic"
    }
  }
}
```

---

## Claims Endpoints

### POST `/api/v1/claims`

Submit a new claim (Provider only).

**Authorization:** User role must be `provider_staff`

**Request:**
```json
{
  "patient": {
    "first_name": "John",
    "last_name": "Smith",
    "date_of_birth": "1975-03-15",
    "member_id": "MEM123456789"
  },
  "service": {
    "cpt_code": "99213",
    "icd10_code": "E11.9",
    "service_date": "2025-10-10",
    "billed_amount": 150.00
  }
}
```

**Validation Rules:**
- `patient.first_name`: Required, 1-100 chars
- `patient.last_name`: Required, 1-100 chars
- `patient.date_of_birth`: Required, valid date, not future, person under 120 years old
- `patient.member_id`: Required, 8-15 alphanumeric chars
- `service.cpt_code`: Required, 5 digits
- `service.icd10_code`: Required, valid ICD-10 format
- `service.service_date`: Required, not future, within last 365 days
- `service.billed_amount`: Required, positive number, max 999999.99

**Success Response (201):**
```json
{
  "claim": {
    "id": "770a0600-g40d-63f6-c938-668877662222",
    "claim_number": "CLM-20251015-0001",
    "status": "submitted",
    "patient": {
      "first_name": "John",
      "last_name": "Smith",
      "date_of_birth": "1975-03-15",
      "member_id": "MEM123456789"
    },
    "service": {
      "cpt_code": "99213",
      "icd10_code": "E11.9",
      "service_date": "2025-10-10",
      "billed_amount": 150.00
    },
    "provider": {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Louisville Primary Care Clinic"
    },
    "submitted_by": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Jones"
    },
    "submitted_at": "2025-10-15T14:30:00Z",
    "created_at": "2025-10-15T14:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "service.service_date": "Service date cannot be in the future",
      "service.billed_amount": "Amount must be positive"
    }
  }
}
```

---

### GET `/api/v1/claims`

List claims (filtered by user role).

**Authorization:** All authenticated users

**Query Parameters:**
- `status` (optional): Filter by status (`submitted`, `approved`, `denied`)
- `from_date` (optional): Filter claims from this date (ISO 8601)
- `to_date` (optional): Filter claims until this date (ISO 8601)

**Behavior by Role:**
- **Provider staff:** Returns only claims submitted by their provider
- **Payer processor:** Returns all claims
- **Admin:** Returns all claims

**Success Response (200):**
```json
{
  "claims": [
    {
      "id": "770a0600-g40d-63f6-c938-668877662222",
      "claim_number": "CLM-20251015-0001",
      "status": "submitted",
      "patient_name": "John Smith",
      "service_date": "2025-10-10",
      "billed_amount": 150.00,
      "approved_amount": null,
      "provider_name": "Louisville Primary Care Clinic",
      "submitted_at": "2025-10-15T14:30:00Z",
      "days_since_submission": 0
    },
    {
      "id": "880b1711-h51e-74g7-d049-779988773333",
      "claim_number": "CLM-20251014-0023",
      "status": "approved",
      "patient_name": "Jane Doe",
      "service_date": "2025-10-08",
      "billed_amount": 200.00,
      "approved_amount": 200.00,
      "provider_name": "Memorial Hospital",
      "submitted_at": "2025-10-14T10:15:00Z",
      "adjudicated_at": "2025-10-14T16:45:00Z",
      "days_since_submission": 1
    }
  ],
  "total": 2
}
```

---

### GET `/api/v1/claims/:id`

Get detailed claim information.

**Authorization:** 
- Provider: Can only view their own claims
- Payer/Admin: Can view any claim

**Success Response (200):**
```json
{
  "claim": {
    "id": "770a0600-g40d-63f6-c938-668877662222",
    "claim_number": "CLM-20251015-0001",
    "status": "approved",
    "patient": {
      "first_name": "John",
      "last_name": "Smith",
      "date_of_birth": "1975-03-15",
      "member_id": "MEM123456789"
    },
    "service": {
      "cpt_code": "99213",
      "icd10_code": "E11.9",
      "service_date": "2025-10-10",
      "billed_amount": 150.00
    },
    "approved_amount": 150.00,
    "adjudication_notes": "Approved as submitted",
    "provider": {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Louisville Primary Care Clinic",
      "npi": "1234567890"
    },
    "submitted_by": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Jones",
      "email": "sarah.jones@lpcc.com"
    },
    "adjudicated_by": {
      "id": "990c2822-i62f-85h8-e150-880099884444",
      "name": "Marcus Williams",
      "email": "marcus.williams@humana.com"
    },
    "submitted_at": "2025-10-15T14:30:00Z",
    "adjudicated_at": "2025-10-15T16:20:00Z",
    "audit_trail": [
      {
        "action": "submitted",
        "performed_by": "Sarah Jones",
        "timestamp": "2025-10-15T14:30:00Z",
        "details": {
          "status": "submitted"
        }
      },
      {
        "action": "approved",
        "performed_by": "Marcus Williams",
        "timestamp": "2025-10-15T16:20:00Z",
        "details": {
          "status": "approved",
          "approved_amount": 150.00,
          "notes": "Approved as submitted"
        }
      }
    ]
  }
}
```

**Error Response (403):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view this claim"
  }
}
```

**Error Response (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Claim not found"
  }
}
```

---

### PATCH `/api/v1/claims/:id/adjudicate`

Approve or deny a claim (Payer only).

**Authorization:** User role must be `payer_processor`

**Request (Approve):**
```json
{
  "decision": "approve",
  "approved_amount": 150.00,
  "notes": "Approved as submitted"
}
```

**Request (Deny):**
```json
{
  "decision": "deny",
  "denial_reason_code": "INVALID_CPT",
  "denial_explanation": "CPT code 99213 not covered for this diagnosis"
}
```

**Validation Rules:**
- `decision`: Required, must be "approve" or "deny"
- If `approve`:
  - `approved_amount`: Required, must be > 0 and <= billed_amount
  - `notes`: Optional, max 500 chars
- If `deny`:
  - `denial_reason_code`: Required, must be valid code
  - `denial_explanation`: Required, min 20 chars, max 1000 chars

**Valid Denial Reason Codes:**
- `INVALID_CPT` — Invalid CPT Code
- `INVALID_DIAGNOSIS` — Missing/Invalid Diagnosis
- `NOT_COVERED` — Service Not Covered
- `PATIENT_INELIGIBLE` — Patient Not Eligible
- `DUPLICATE_CLAIM` — Duplicate Claim
- `INSUFFICIENT_DOCS` — Insufficient Documentation
- `OTHER` — Other (requires detailed explanation)

**Success Response (200):**
```json
{
  "claim": {
    "id": "770a0600-g40d-63f6-c938-668877662222",
    "claim_number": "CLM-20251015-0001",
    "status": "approved",
    "approved_amount": 150.00,
    "adjudication_notes": "Approved as submitted",
    "adjudicated_by": {
      "id": "990c2822-i62f-85h8-e150-880099884444",
      "name": "Marcus Williams"
    },
    "adjudicated_at": "2025-10-15T16:20:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid adjudication data",
    "details": {
      "approved_amount": "Approved amount cannot exceed billed amount"
    }
  }
}
```

**Error Response (409):**
```json
{
  "error": {
    "code": "CLAIM_ALREADY_ADJUDICATED",
    "message": "This claim has already been adjudicated"
  }
}
```

---

## User Endpoints

### GET `/api/v1/users/profile`

Get current user's full profile.

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "sarah.jones@lpcc.com",
    "role": "provider_staff",
    "first_name": "Sarah",
    "last_name": "Jones",
    "is_active": true,
    "last_login": "2025-10-15T14:00:00Z",
    "created_at": "2025-09-01T08:00:00Z",
    "provider": {
      "id": "660f9500-f39c-52e5-b827-557766551111",
      "name": "Louisville Primary Care Clinic",
      "npi": "1234567890",
      "phone": "(502) 555-0100",
      "email": "contact@lpcc.com"
    }
  }
}
```

---

## Provider Endpoints

### GET `/api/v1/providers/:id`

Get provider details (any authenticated user).

**Success Response (200):**
```json
{
  "provider": {
    "id": "660f9500-f39c-52e5-b827-557766551111",
    "name": "Louisville Primary Care Clinic",
    "npi": "1234567890",
    "address": {
      "line1": "123 Main Street",
      "line2": "Suite 200",
      "city": "Louisville",
      "state": "KY",
      "zip_code": "40202"
    },
    "phone": "(502) 555-0100",
    "email": "contact@lpcc.com"
  }
}
```

---

## Admin Endpoints (Future)

### GET `/api/v1/admin/users`

List all users (Admin only).

### POST `/api/v1/admin/users`

Create new user account (Admin only).

### GET `/api/v1/admin/audit-log`

View full audit log (Admin only).

---

## 🔐 Security Headers

All API responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 🧪 Testing Endpoints

### Health Check

**GET `/api/v1/health`**

Check if API is running (no auth required).

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-15T14:30:00Z"
}
```

---

## 📝 Example Integration Flow

### Complete Claim Submission and Adjudication

**1. Provider logs in**
```
POST /api/v1/auth/login
Body: { email, password }
→ Returns session cookie
```

**2. Provider submits claim**
```
POST /api/v1/claims
Headers: Cookie: cms_session=...
Body: { patient, service }
→ Returns claim with status "submitted"
```

**3. Provider views their claims**
```
GET /api/v1/claims
Headers: Cookie: cms_session=...
→ Returns list including new claim
```

**4. Payer logs in**
```
POST /api/v1/auth/login
Body: { email, password }
→ Returns session cookie
```

**5. Payer views claims queue**
```
GET /api/v1/claims?status=submitted
Headers: Cookie: cms_session=...
→ Returns all submitted claims
```

**6. Payer adjudicates claim**
```
PATCH /api/v1/claims/:id/adjudicate
Headers: Cookie: cms_session=...
Body: { decision: "approve", approved_amount: 150 }
→ Returns updated claim with status "approved"
```

**7. Provider checks status**
```
GET /api/v1/claims/:id
Headers: Cookie: cms_session=...
→ Returns claim with approved status and audit trail
```

---

## 🚀 Rate Limiting (Future)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634308800
```

- 100 requests per 15-minute window per user
- Returns 429 (Too Many Requests) when exceeded

---

**End of API Contracts Specification**

*This document defines the complete REST API contract for MVP. All endpoints are versioned under `/api/v1` to allow future evolution without breaking changes.*
