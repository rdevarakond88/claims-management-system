# Database Schema Documentation
## Claims Management System (CMS)

**Document Status:** 🚧 Draft — In Development
**Last Updated:** October 2025
**Version:** 1.0.0
**Database:** PostgreSQL 14+
**ORM:** Prisma 5.x

---

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Schema Migrations](#schema-migrations)
6. [Data Types & Constraints](#data-types--constraints)

---

## Schema Overview

The CMS database is designed to support a multi-tenant claims management workflow with role-based access control. The schema includes:

- **User management** — Providers, payers, and admins with authentication
- **Claims processing** — Submission, adjudication, and status tracking
- **AI categorization** — Priority-based claim routing (planned)
- **Audit trail** — Complete history of all claim actions
- **Session management** — Secure session storage for authentication

### Design Principles
- **Normalization** — 3rd Normal Form (3NF) to reduce redundancy
- **Referential integrity** — Foreign key constraints with cascading deletes where appropriate
- **Audit trail** — All state changes logged with user attribution
- **Type safety** — Strongly typed fields with constraints
- **Performance** — Strategic indexing for common queries

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Provider   │         │     User     │         │    Payer    │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │◄───────┤│ id (PK)      │├───────►│ id (PK)     │
│ name        │         │ email        │         │ name        │
│ npi         │         │ passwordHash │         │ payerCode   │
│ ...         │         │ role         │         │ ...         │
└─────────────┘         │ providerId   │         └─────────────┘
                        │ payerId      │
                        └──────────────┘
                               │
                               │ submittedBy
                               │
┌─────────────┐         ┌──────▼───────┐         ┌─────────────┐
│  AuditLog   │         │    Claim     │         │   Session   │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │◄───────┤│ id (PK)      │         │ sid (PK)    │
│ claimId (FK)│         │ claimNumber  │         │ sess        │
│ userId (FK) │         │ providerId   │         │ expire      │
│ action      │         │ status       │         └─────────────┘
│ oldStatus   │         │ priority *   │
│ newStatus   │         │ ...          │
└─────────────┘         └──────────────┘
                               │
                               │ adjudicatedBy
                               ▼
                        ┌──────────────┐
                        │     User     │
                        └──────────────┘

* priority field planned for AI categorization feature
```

---

## Tables

### 1. providers

**Description:** Healthcare organizations that submit claims.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Provider organization name |
| `npi` | VARCHAR(10) | UNIQUE, NOT NULL | National Provider Identifier |
| `city` | VARCHAR(100) | NULLABLE | Provider city |
| `state` | VARCHAR(2) | NULLABLE | Two-letter state code |
| `phone` | VARCHAR(20) | NULLABLE | Contact phone number |
| `email` | VARCHAR(255) | NULLABLE | Contact email address |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO-UPDATE | Last update timestamp |

**Relationships:**
- One-to-Many with `users` (provider staff)
- One-to-Many with `claims` (submitted claims)

**Business Rules:**
- NPI must be a valid 10-digit identifier
- At least one contact method (email or phone) recommended

---

### 2. payers

**Description:** Insurance companies that adjudicate claims.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Payer organization name |
| `payer_code` | VARCHAR(10) | UNIQUE, NOT NULL | Internal payer code |
| `city` | VARCHAR(100) | NULLABLE | Payer city |
| `state` | VARCHAR(2) | NULLABLE | Two-letter state code |
| `phone` | VARCHAR(20) | NULLABLE | Contact phone number |
| `email` | VARCHAR(255) | NULLABLE | Contact email address |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO-UPDATE | Last update timestamp |

**Relationships:**
- One-to-Many with `users` (payer staff)

---

### 3. users

**Description:** System users (providers, payers, admins) with authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email (login username) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `role` | VARCHAR(20) | NOT NULL | User role: `provider`, `payer`, `admin` |
| `provider_id` | UUID | FOREIGN KEY, NULLABLE | Reference to providers table (if role=provider) |
| `payer_id` | UUID | FOREIGN KEY, NULLABLE | Reference to payers table (if role=payer) |
| `first_name` | VARCHAR(100) | NULLABLE | User's first name |
| `last_name` | VARCHAR(100) | NULLABLE | User's last name |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status |
| `is_first_login` | BOOLEAN | NOT NULL, DEFAULT TRUE | Requires password change flag |
| `last_login` | TIMESTAMP | NULLABLE | Last successful login timestamp |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO-UPDATE | Last update timestamp |

**Relationships:**
- Many-to-One with `providers` (optional, for provider users)
- Many-to-One with `payers` (optional, for payer users)
- One-to-Many with `claims` as `submittedBy`
- One-to-Many with `claims` as `adjudicatedBy`
- One-to-Many with `audit_log`

**Business Rules:**
- `provider_id` required if `role = 'provider'`
- `payer_id` required if `role = 'payer'`
- Admin users have neither `provider_id` nor `payer_id`
- Password must be bcrypt-hashed with cost factor ≥ 10
- `is_first_login` forces password change on first authentication

---

### 4. claims

**Description:** Healthcare claims submitted by providers for payer adjudication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `claim_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable claim number (CLM-YYYYMMDD-NNNN) |
| `provider_id` | UUID | FOREIGN KEY, NOT NULL | Reference to providers table |
| `submitted_by_user_id` | UUID | FOREIGN KEY, NOT NULL | Reference to users table (provider staff) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'submitted' | Claim status: `submitted`, `approved`, `denied` |
| `priority` 🆕 | VARCHAR(20) | NOT NULL, DEFAULT 'standard' | AI-assigned priority: `urgent`, `standard`, `routine` |
| `patient_first_name` | VARCHAR(100) | NOT NULL | Patient's first name |
| `patient_last_name` | VARCHAR(100) | NOT NULL | Patient's last name |
| `patient_dob` | DATE | NOT NULL | Patient's date of birth |
| `patient_member_id` | VARCHAR(50) | NOT NULL | Insurance member ID |
| `cpt_code` | VARCHAR(10) | NOT NULL | Current Procedural Terminology code |
| `icd10_code` | VARCHAR(10) | NOT NULL | ICD-10 diagnosis code |
| `service_date` | DATE | NOT NULL | Date service was provided |
| `billed_amount` | DECIMAL(10,2) | NOT NULL | Amount billed by provider |
| `approved_amount` | DECIMAL(10,2) | NULLABLE | Amount approved by payer (if approved) |
| `denial_reason_code` | VARCHAR(10) | NULLABLE | Standard denial code (if denied) |
| `denial_explanation` | TEXT | NULLABLE | Human-readable denial reason |
| `adjudication_notes` | TEXT | NULLABLE | Payer notes during adjudication |
| `adjudicated_by_user_id` | UUID | FOREIGN KEY, NULLABLE | Reference to users table (payer staff) |
| `adjudicated_at` | TIMESTAMP | NULLABLE | Timestamp of adjudication decision |
| `submitted_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Claim submission timestamp |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO-UPDATE | Last update timestamp |

**Relationships:**
- Many-to-One with `providers`
- Many-to-One with `users` as `submittedBy`
- Many-to-One with `users` as `adjudicatedBy`
- One-to-Many with `audit_log`

**Business Rules:**
- `status` can only be: `submitted`, `approved`, `denied`
- `priority` (new) can only be: `urgent`, `standard`, `routine`
- `approved_amount` ≤ `billed_amount` (enforced at application level)
- `approved_amount` required if `status = 'approved'`
- `denial_reason_code` and `denial_explanation` required if `status = 'denied'`
- `adjudicated_by_user_id` and `adjudicated_at` populated when status changes from `submitted`

**🆕 AI Categorization Feature:**
- `priority` field added to support AI-powered claim routing
- Default value: `'standard'` (fallback if AI service fails)
- Assigned during claim submission based on CPT/ICD-10 codes and billed amount
- Indexed with `created_at` for efficient payer queue sorting

---

### 5. audit_log

**Description:** Complete audit trail of all claim state changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated unique identifier |
| `claim_id` | UUID | FOREIGN KEY, NOT NULL | Reference to claims table |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | User who performed the action |
| `action` | VARCHAR(50) | NOT NULL | Action type: `claim_submitted`, `claim_approved`, `claim_denied`, etc. |
| `old_status` | VARCHAR(20) | NULLABLE | Previous claim status (before action) |
| `new_status` | VARCHAR(20) | NULLABLE | New claim status (after action) |
| `details` | JSON | NULLABLE | Additional action details (flexible schema) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Relationships:**
- Many-to-One with `claims` (cascading delete)
- Many-to-One with `users`

**Business Rules:**
- Audit log entries are immutable (no updates or deletes except cascading)
- All claim status changes must create an audit entry
- AI categorization decisions logged in `details` field

**Example `details` JSON:**
```json
{
  "priority": "urgent",
  "aiConfidence": 0.95,
  "aiReasoning": "Emergency procedure with high cost"
}
```

---

### 6. session

**Description:** Session storage for Express session middleware (connect-pg-simple).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sid` | VARCHAR | PRIMARY KEY | Session ID (unique) |
| `sess` | JSON | NOT NULL | Session data (user ID, role, etc.) |
| `expire` | TIMESTAMP | NOT NULL | Session expiration timestamp |

**Indexes:**
- `IDX_session_expire` on `expire` (for efficient cleanup)

**Business Rules:**
- Sessions automatically deleted after expiration (handled by middleware)
- Session timeout: 30 minutes of inactivity

---

## Indexes

### Performance Indexes

| Table | Index Name | Columns | Type | Purpose |
|-------|------------|---------|------|---------|
| `providers` | `providers_npi_key` | `npi` | UNIQUE | Fast provider lookup by NPI |
| `payers` | `payers_payer_code_key` | `payer_code` | UNIQUE | Fast payer lookup by code |
| `users` | `users_email_key` | `email` | UNIQUE | Fast user authentication |
| `claims` | `claims_claim_number_key` | `claim_number` | UNIQUE | Fast claim lookup |
| `claims` 🆕 | `idx_claims_priority_created_at` | `priority, created_at` | COMPOSITE | **Payer queue sorting (Urgent → Standard → Routine)** |
| `claims` | `idx_claims_provider_id` | `provider_id` | STANDARD | Provider dashboard queries |
| `claims` | `idx_claims_status` | `status` | STANDARD | Filter by claim status |
| `audit_log` | `audit_log_claim_id_fkey` | `claim_id` | FOREIGN KEY | Audit trail lookups |
| `session` | `IDX_session_expire` | `expire` | STANDARD | Session cleanup |

**🆕 New Index for AI Categorization:**
```sql
CREATE INDEX idx_claims_priority_created_at ON claims(priority, created_at DESC);
```
- Optimizes payer queue query: `ORDER BY priority DESC, created_at DESC`
- Supports filtering by priority level
- Critical for feature performance

---

## Schema Migrations

### Migration History

| Version | Date | Description |
|---------|------|-------------|
| `001_initial_schema` | 2025-10 | Initial schema with providers, payers, users, claims, audit_log |
| `002_session_table` | 2025-10 | Add session table for express-session |
| `003_ai_categorization` 🆕 | 2025-10 (planned) | Add priority field to claims table with index |

### Upcoming Migration: AI Categorization

**File:** `003_ai_categorization.sql`

```sql
-- Add priority field to claims table
ALTER TABLE claims
ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'standard';

-- Add check constraint for valid priority values
ALTER TABLE claims
ADD CONSTRAINT check_priority_values
CHECK (priority IN ('urgent', 'standard', 'routine'));

-- Create composite index for efficient payer queue sorting
CREATE INDEX idx_claims_priority_created_at
ON claims(priority, created_at DESC);

-- Update Prisma schema enum
-- (Handled by Prisma migration, not SQL)
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_claims_priority_created_at;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS check_priority_values;
ALTER TABLE claims DROP COLUMN IF EXISTS priority;
```

---

## Data Types & Constraints

### Field Conventions

**UUIDs:**
- All primary keys use `UUID v4` for uniqueness across distributed systems
- Generated by PostgreSQL `uuid_generate_v4()` or Prisma `@default(uuid())`

**Timestamps:**
- All tables include `created_at` and `updated_at`
- Timezone-aware (`TIMESTAMP WITH TIME ZONE`)
- Automatically managed by Prisma

**Enums (Application-Level):**
- `role`: `provider`, `payer`, `admin`
- `status`: `submitted`, `approved`, `denied`
- `priority` 🆕: `urgent`, `standard`, `routine`
- Stored as VARCHAR with CHECK constraints (not PostgreSQL ENUMs for flexibility)

**Monetary Values:**
- `DECIMAL(10,2)` for currency (up to $99,999,999.99)
- Application-level validation ensures positive values

**Dates:**
- `DATE` type for dates without time (DOB, service date)
- `TIMESTAMP` for date+time (audit trail, login tracking)

---

## Security Considerations

### Password Storage
- Passwords hashed using **bcrypt** with cost factor ≥ 10
- Never store plaintext passwords
- Temporary passwords auto-generated with high entropy (12+ chars)

### Data Privacy
- No real PHI (Protected Health Information) — demo data only
- In production: encrypt sensitive fields at rest
- Audit log captures all data access for compliance

### SQL Injection Protection
- Prisma ORM uses parameterized queries (no raw SQL)
- All user input sanitized before database operations

---

## Prisma Schema Reference

**Location:** `/backend/prisma/schema.prisma`

**Key Models (Updated for AI Categorization):**

```prisma
model Claim {
  id                  String     @id @default(uuid())
  claimNumber         String     @unique @map("claim_number")
  providerId          String     @map("provider_id")
  submittedByUserId   String     @map("submitted_by_user_id")
  status              String     @default("submitted")
  priority            Priority   @default(STANDARD) // 🆕 New field

  // Patient info
  patientFirstName    String     @map("patient_first_name")
  patientLastName     String     @map("patient_last_name")
  patientDob          DateTime   @map("patient_dob") @db.Date
  patientMemberId     String     @map("patient_member_id")

  // Service details
  cptCode             String     @map("cpt_code")
  icd10Code           String     @map("icd10_code")
  serviceDate         DateTime   @map("service_date") @db.Date
  billedAmount        Decimal    @map("billed_amount") @db.Decimal(10, 2)

  // Adjudication fields
  approvedAmount      Decimal?   @map("approved_amount") @db.Decimal(10, 2)
  denialReasonCode    String?    @map("denial_reason_code")
  denialExplanation   String?    @map("denial_explanation")
  adjudicationNotes   String?    @map("adjudication_notes")
  adjudicatedByUserId String?    @map("adjudicated_by_user_id")
  adjudicatedAt       DateTime?  @map("adjudicated_at")

  // Timestamps
  submittedAt         DateTime   @default(now()) @map("submitted_at")
  createdAt           DateTime   @default(now()) @map("created_at")
  updatedAt           DateTime   @updatedAt @map("updated_at")

  // Relations
  auditLogs           AuditLog[]
  adjudicatedBy       User?      @relation("AdjudicatedBy", fields: [adjudicatedByUserId], references: [id])
  provider            Provider   @relation(fields: [providerId], references: [id])
  submittedBy         User       @relation("SubmittedBy", fields: [submittedByUserId], references: [id])

  @@map("claims")
  @@index([priority, createdAt]) // 🆕 New composite index
}

// 🆕 New enum for AI priority categorization
enum Priority {
  URGENT
  STANDARD
  ROUTINE
}
```

---

## Query Patterns

### Common Queries (Updated for AI Categorization)

**1. Payer Queue (Sorted by Priority):**
```sql
SELECT * FROM claims
WHERE status = 'submitted'
ORDER BY
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'routine' THEN 3
  END,
  created_at DESC
LIMIT 20 OFFSET 0;
```

**2. Provider Dashboard (Own Claims):**
```sql
SELECT * FROM claims
WHERE provider_id = $1
ORDER BY created_at DESC
LIMIT 20;
```

**3. Claim Details with Audit Trail:**
```sql
SELECT
  c.*,
  p.name as provider_name,
  u.first_name || ' ' || u.last_name as submitted_by_name,
  a.first_name || ' ' || a.last_name as adjudicated_by_name
FROM claims c
JOIN providers p ON c.provider_id = p.id
JOIN users u ON c.submitted_by_user_id = u.id
LEFT JOIN users a ON c.adjudicated_by_user_id = a.id
WHERE c.id = $1;
```

**4. AI Categorization Audit Log:**
```sql
SELECT * FROM audit_log
WHERE claim_id = $1
  AND action = 'ai_categorization'
ORDER BY created_at DESC;
```

---

## Database Maintenance

### Backup Strategy
- **Frequency:** Daily automated backups
- **Retention:** 30 days for MVP
- **Method:** PostgreSQL `pg_dump` with compression

### Cleanup Tasks
- **Sessions:** Automatic cleanup via `connect-pg-simple` (expired sessions)
- **Audit logs:** Retain indefinitely for compliance (MVP), implement archival in production

### Performance Monitoring
- Monitor slow queries (>100ms)
- Index usage statistics via `pg_stat_user_indexes`
- Connection pooling via Prisma (default: 10 connections)

---

**Document End**
