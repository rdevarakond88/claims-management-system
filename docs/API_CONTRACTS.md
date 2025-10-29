# API Contracts Documentation
## Claims Management System (CMS)

**Document Status:** 🚧 Draft — In Development
**Last Updated:** October 2025
**Version:** 1.0.0
**Base URL:** `/api/v1`

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Claims Endpoints](#claims-endpoints)
3. [User Management Endpoints](#user-management-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [AI Services](#ai-services)
6. [Error Responses](#error-responses)
7. [Common Data Models](#common-data-models)

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "role": "provider | payer | admin",
    "firstName": "string",
    "lastName": "string",
    "requiresPasswordChange": "boolean"
  },
  "sessionToken": "string"
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid credentials
- `400 Bad Request` — Missing or invalid fields

---

### POST /api/auth/set-password
Set a new password for first-time login or password reset.

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars, must include uppercase, lowercase, number)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `401 Unauthorized` — Current password incorrect
- `400 Bad Request` — Password doesn't meet requirements
- `403 Forbidden` — Not authenticated

---

### POST /api/auth/logout
Terminate the current user session.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Claims Endpoints

### POST /api/claims
Submit a new claim with AI-powered priority categorization.

**Authorization:** Provider role required

**Request Body:**
```json
{
  "patient": {
    "firstName": "string (required)",
    "lastName": "string (required)",
    "dateOfBirth": "string (required, ISO 8601 date format: YYYY-MM-DD)",
    "memberId": "string (required)"
  },
  "service": {
    "cptCode": "string (required, valid CPT code)",
    "icd10Code": "string (required, valid ICD-10 code)",
    "serviceDate": "string (required, ISO 8601 date)",
    "billedAmount": "number (required, positive number)"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "claim": {
    "id": "string (UUID)",
    "claimNumber": "string (CLM-YYYYMMDD-NNNN)",
    "status": "submitted",
    "priority": "urgent | standard | routine",
    "priorityConfidence": "number (0-1, AI confidence score)",
    "priorityReasoning": "string (human-readable explanation)",
    "patient": {
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "string",
      "memberId": "string"
    },
    "service": {
      "cptCode": "string",
      "icd10Code": "string",
      "serviceDate": "string",
      "billedAmount": "number"
    },
    "provider": {
      "id": "string",
      "name": "string",
      "npi": "string"
    },
    "createdAt": "string (ISO 8601 timestamp)",
    "updatedAt": "string (ISO 8601 timestamp)"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Not authenticated
- `403 Forbidden` — User is not a provider
- `400 Bad Request` — Invalid or missing fields
- `500 Internal Server Error` — AI service error (claim still saved with default priority)

**Notes:**
- AI categorization happens synchronously before claim creation
- If AI service fails, claim defaults to "standard" priority
- AI categorization typically completes within 2 seconds

---

### GET /api/claims
List all claims visible to the authenticated user.

**Authorization:** Provider, Payer, or Admin role

**Query Parameters:**
- `status` (optional): Filter by status (`submitted`, `approved`, `denied`)
- `priority` (optional): Filter by priority (`urgent`, `standard`, `routine`)
- `startDate` (optional): Filter by service date (ISO 8601)
- `endDate` (optional): Filter by service date (ISO 8601)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20, max: 100): Items per page
- `sortBy` (optional, default: `priority,createdAt`): Sort field(s)
- `sortOrder` (optional, default: `desc`): Sort order (`asc`, `desc`)

**Success Response (200):**
```json
{
  "success": true,
  "claims": [
    {
      "id": "string",
      "claimNumber": "string",
      "status": "submitted | approved | denied",
      "priority": "urgent | standard | routine",
      "patient": {
        "firstName": "string",
        "lastName": "string",
        "memberId": "string"
      },
      "service": {
        "serviceDate": "string",
        "billedAmount": "number"
      },
      "provider": {
        "name": "string"
      },
      "payer": {
        "name": "string"
      },
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "totalItems": "number",
    "totalPages": "number",
    "hasNextPage": "boolean",
    "hasPreviousPage": "boolean"
  }
}
```

**Business Rules:**
- **Providers** see only their own submitted claims
- **Payers** see all claims assigned to their organization
- **Admins** see all claims in the system
- Default sort: priority (urgent → standard → routine), then by creation date (newest first)

---

### GET /api/claims/:id
Get detailed information about a specific claim.

**Authorization:** Provider (own claims), Payer, or Admin

**URL Parameters:**
- `id` (required): Claim ID (UUID)

**Success Response (200):**
```json
{
  "success": true,
  "claim": {
    "id": "string",
    "claimNumber": "string",
    "status": "submitted | approved | denied",
    "priority": "urgent | standard | routine",
    "priorityConfidence": "number",
    "priorityReasoning": "string",
    "patient": {
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "string",
      "memberId": "string"
    },
    "service": {
      "cptCode": "string",
      "icd10Code": "string",
      "serviceDate": "string",
      "billedAmount": "number"
    },
    "provider": {
      "id": "string",
      "name": "string",
      "npi": "string",
      "contactEmail": "string"
    },
    "payer": {
      "id": "string",
      "name": "string"
    },
    "adjudication": {
      "approvedAmount": "number | null",
      "denialReason": "string | null",
      "denialCode": "string | null",
      "adjudicatedBy": "string | null",
      "adjudicatedAt": "string | null",
      "notes": "string | null"
    },
    "history": [
      {
        "action": "string",
        "performedBy": {
          "id": "string",
          "name": "string",
          "role": "string"
        },
        "timestamp": "string",
        "details": "object | null"
      }
    ],
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `404 Not Found` — Claim does not exist
- `403 Forbidden` — User does not have permission to view this claim

---

### PATCH /api/claims/:id/adjudicate
Approve or deny a claim (payer action).

**Authorization:** Payer role required

**URL Parameters:**
- `id` (required): Claim ID (UUID)

**Request Body (Approve):**
```json
{
  "decision": "approved",
  "approvedAmount": "number (required, must be ≤ billedAmount)",
  "notes": "string (optional)"
}
```

**Request Body (Deny):**
```json
{
  "decision": "denied",
  "denialReason": "string (required)",
  "denialCode": "string (optional, standard denial code)",
  "notes": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "claim": {
    "id": "string",
    "claimNumber": "string",
    "status": "approved | denied",
    "adjudication": {
      "decision": "approved | denied",
      "approvedAmount": "number | null",
      "denialReason": "string | null",
      "denialCode": "string | null",
      "adjudicatedBy": "string",
      "adjudicatedAt": "string",
      "notes": "string | null"
    },
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid decision data
- `403 Forbidden` — User is not a payer
- `404 Not Found` — Claim does not exist
- `409 Conflict` — Claim already adjudicated

---

## User Management Endpoints

### GET /api/users/profile
Get the authenticated user's profile information.

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "role": "provider | payer | admin",
    "firstName": "string",
    "lastName": "string",
    "organization": {
      "id": "string",
      "name": "string",
      "type": "provider | payer"
    },
    "createdAt": "string",
    "lastLoginAt": "string"
  }
}
```

---

## Admin Endpoints

### GET /api/admin/users
List all users in the system (admin only).

**Authorization:** Admin role required

**Query Parameters:**
- `role` (optional): Filter by role (`provider`, `payer`, `admin`)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "email": "string",
      "role": "string",
      "firstName": "string",
      "lastName": "string",
      "organization": {
        "name": "string"
      },
      "isActive": "boolean",
      "requiresPasswordChange": "boolean",
      "createdAt": "string",
      "lastLoginAt": "string | null"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "totalItems": "number",
    "totalPages": "number"
  }
}
```

---

### POST /api/admin/users
Create a new user account with temporary password (admin only).

**Authorization:** Admin role required

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "role": "provider | payer | admin (required)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "organizationId": "string (required for provider/payer roles)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "temporaryPassword": "string (display once, 12+ chars)"
  },
  "message": "User created successfully. Temporary password must be shared securely with the user."
}
```

**Error Responses:**
- `400 Bad Request` — Invalid or missing fields
- `409 Conflict` — User with this email already exists
- `403 Forbidden` — User is not an admin

**Notes:**
- Temporary password is auto-generated (12+ characters, secure)
- User must change password on first login
- Temporary password is returned only once and cannot be retrieved later

---

## AI Services

### Internal Service: AI Claim Categorization

**Service Name:** `aiCategorizationService`

**Function:** `categorizeClaim(claimData)`

**Description:**
Automatically categorizes a claim by priority using Anthropic Claude API based on CPT code, ICD-10 code, billed amount, and clinical urgency indicators.

**Input:**
```typescript
{
  cptCode: string;       // Current Procedural Terminology code
  icd10Code: string;     // International Classification of Diseases code
  billedAmount: number;  // Claim amount in dollars
}
```

**Output:**
```typescript
{
  priority: "urgent" | "standard" | "routine";
  confidence: number;    // 0.0 - 1.0
  reasoning: string;     // Human-readable explanation
}
```

**Priority Assignment Logic:**

🔴 **Urgent:**
- Emergency procedures (CPT codes 99281-99285)
- Critical diagnoses (ICD-10 codes for life-threatening conditions)
- High-cost claims (>$5,000)
- Time-sensitive treatments

🟡 **Standard:**
- Routine hospitalizations
- Moderate-cost procedures ($500-$5,000)
- Non-emergency medically necessary care

🟢 **Routine:**
- Preventive care (CPT codes 99381-99397)
- Annual checkups
- Low-cost procedures (<$500)
- Non-urgent follow-ups

**Error Handling:**
- If AI service fails, default to "standard" priority
- Log error with claim ID for audit
- Continue claim submission without blocking

**Performance:**
- Target response time: <2 seconds
- Timeout: 5 seconds
- Retry policy: No retries (fail fast, use default)

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "string (ERROR_CODE)",
    "message": "string (human-readable error)",
    "details": "object | null (additional context)"
  }
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `INVALID_REQUEST` | Missing or invalid request parameters |
| 401 | `UNAUTHORIZED` | Authentication required or invalid credentials |
| 403 | `FORBIDDEN` | User lacks permission for this action |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate email, already adjudicated) |
| 422 | `VALIDATION_FAILED` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid CPT code format",
    "details": {
      "field": "service.cptCode",
      "value": "INVALID",
      "constraint": "Must be a valid 5-digit CPT code"
    }
  }
}
```

---

## Common Data Models

### Claim Status Enum
```
- submitted: Claim submitted by provider, awaiting review
- approved: Claim approved by payer
- denied: Claim denied by payer
```

### Priority Enum
```
- urgent: High-priority claim requiring immediate review
- standard: Normal priority claim
- routine: Low-priority claim
```

### Role Enum
```
- provider: Healthcare provider (submits claims)
- payer: Insurance payer (adjudicates claims)
- admin: System administrator
```

---

## Versioning

**Current Version:** v1
**Base Path:** `/api/v1`

All endpoints are versioned to ensure backward compatibility. Breaking changes will increment the major version number.

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user
- AI categorization: 50 calls per minute (shared across all users)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432 (Unix timestamp)
```

When rate limit is exceeded, API returns `429 Too Many Requests`.

---

## Authentication

**Method:** Session-based authentication using HTTP-only cookies

**Headers:**
```
Cookie: sessionId=<session-token>
```

**Session Duration:** 30 minutes of inactivity
**CSRF Protection:** Enabled for state-changing requests

---

## API Design Principles

1. **RESTful conventions** — Use standard HTTP methods (GET, POST, PATCH, DELETE)
2. **JSON format** — All requests and responses use JSON
3. **Consistent error handling** — Standardized error response format
4. **Pagination** — All list endpoints support pagination
5. **Filtering & sorting** — List endpoints support query parameters
6. **Idempotency** — POST requests use idempotency keys where appropriate
7. **Versioning** — All endpoints versioned for backward compatibility

---

**Document End**
