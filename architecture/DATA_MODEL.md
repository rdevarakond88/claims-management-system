# Data Model Specification
## Claims Management System (CMS)

**Document Owner:** rdevarakond88  
**Last Updated:** October 2025  
**Database:** PostgreSQL 14+

---

## 📊 Entity-Relationship Diagram

```
┌─────────────┐       ┌──────────────┐
│  Providers  │       │    Payers    │
└──────┬──────┘       └──────┬───────┘
       │                     │
       │ 1:N                 │ 1:N
       │                     │
┌──────▼──────┐       ┌──────▼───────┐
│    Users    │       │    Users     │
│ (Provider)  │       │   (Payer)    │
└──────┬──────┘       └──────┬───────┘
       │                     │
       │ 1:N                 │ 1:N
       │                     │
       │              ┌──────▼───────┐
       │              │ Adjudication │
       │              │   (action)   │
       │              └──────┬───────┘
       │                     │
       │                     │ N:1
┌──────▼─────────────────────▼───────┐
│            Claims                  │
└──────┬─────────────────────────────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│  AuditLog   │
└─────────────┘
```

**Key Relationships:**
- Provider → Users (1:N) — A provider organization has many users
- Payer → Users (1:N) — A payer organization has many users
- User (Provider) → Claims (1:N) — A provider user submits many claims
- User (Payer) → Claims (1:N) — A payer user adjudicates many claims
- Claim → AuditLog (1:N) — Each claim has multiple audit entries

---

## 🗄️ Table Schemas

### 1. `providers`

Stores information about healthcare provider organizations (hospitals, clinics).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique provider identifier |
| `name` | VARCHAR(200) | NOT NULL | Provider organization name |
| `npi` | VARCHAR(10) | NOT NULL, UNIQUE | National Provider Identifier |
| `address_line1` | VARCHAR(200) | | Street address |
| `address_line2` | VARCHAR(200) | | Suite/building number |
| `city` | VARCHAR(100) | | City |
| `state` | VARCHAR(2) | | State code (e.g., 'KY') |
| `zip_code` | VARCHAR(10) | | ZIP code |
| `phone` | VARCHAR(20) | | Contact phone |
| `email` | VARCHAR(100) | | Contact email |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_providers_npi` on `npi` (for lookups)

**Sample Data:**
```sql
INSERT INTO providers (name, npi, city, state) VALUES
('Louisville Primary Care Clinic', '1234567890', 'Louisville', 'KY'),
('Memorial Hospital', '0987654321', 'Lexington', 'KY');
```

---

### 2. `payers`

Stores information about insurance payer organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique payer identifier |
| `name` | VARCHAR(200) | NOT NULL | Payer organization name |
| `payer_code` | VARCHAR(20) | NOT NULL, UNIQUE | Industry standard payer code |
| `address_line1` | VARCHAR(200) | | Street address |
| `address_line2` | VARCHAR(200) | | Suite/building number |
| `city` | VARCHAR(100) | | City |
| `state` | VARCHAR(2) | | State code |
| `zip_code` | VARCHAR(10) | | ZIP code |
| `phone` | VARCHAR(20) | | Contact phone |
| `email` | VARCHAR(100) | | Contact email |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_payers_code` on `payer_code`

**Sample Data:**
```sql
INSERT INTO payers (name, payer_code, city, state) VALUES
('Humana Health', 'HUM001', 'Louisville', 'KY'),
('UnitedHealthcare', 'UHC001', 'Cincinnati', 'OH');
```

---

### 3. `users`

Stores user authentication and role information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Login email (username) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(20) | NOT NULL, CHECK (role IN ('provider_staff', 'payer_processor', 'admin')) | User role |
| `provider_id` | UUID | FOREIGN KEY → providers(id) | Associated provider (if role = provider_staff) |
| `payer_id` | UUID | FOREIGN KEY → payers(id) | Associated payer (if role = payer_processor) |
| `first_name` | VARCHAR(100) | | User first name |
| `last_name` | VARCHAR(100) | | User last name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `last_login` | TIMESTAMP | | Last login timestamp |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Constraints:**
- `CHECK ((role = 'provider_staff' AND provider_id IS NOT NULL AND payer_id IS NULL) OR (role = 'payer_processor' AND payer_id IS NOT NULL AND provider_id IS NULL) OR (role = 'admin'))` — Ensures provider users have provider_id, payer users have payer_id

**Indexes:**
- `idx_users_email` on `email` (for login lookups)
- `idx_users_provider` on `provider_id` (for filtering provider users)
- `idx_users_payer` on `payer_id` (for filtering payer users)

**Sample Data:**
```sql
-- Provider user
INSERT INTO users (email, password_hash, role, provider_id, first_name, last_name) VALUES
('sarah.jones@lpcc.com', '$2b$10$...', 'provider_staff', '<provider_uuid>', 'Sarah', 'Jones');

-- Payer user
INSERT INTO users (email, password_hash, role, payer_id, first_name, last_name) VALUES
('marcus.williams@humana.com', '$2b$10$...', 'payer_processor', '<payer_uuid>', 'Marcus', 'Williams');
```

---

### 4. `claims`

Core entity storing all claim data and status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique claim identifier |
| `claim_number` | VARCHAR(20) | NOT NULL, UNIQUE | Human-readable ID (CLM-YYYYMMDD-####) |
| `provider_id` | UUID | NOT NULL, FOREIGN KEY → providers(id) | Provider who submitted claim |
| `submitted_by_user_id` | UUID | NOT NULL, FOREIGN KEY → users(id) | User who submitted claim |
| `payer_id` | UUID | | Target payer (future: for routing) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'submitted', CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'paid')) | Current claim status |
| `patient_first_name` | VARCHAR(100) | NOT NULL | Patient first name |
| `patient_last_name` | VARCHAR(100) | NOT NULL | Patient last name |
| `patient_dob` | DATE | NOT NULL | Patient date of birth |
| `patient_member_id` | VARCHAR(50) | NOT NULL | Insurance member ID |
| `cpt_code` | VARCHAR(10) | NOT NULL | CPT procedure code (e.g., '99213') |
| `icd10_code` | VARCHAR(10) | NOT NULL | ICD-10 diagnosis code (e.g., 'E11.9') |
| `service_date` | DATE | NOT NULL | Date service was provided |
| `billed_amount` | NUMERIC(10,2) | NOT NULL, CHECK (billed_amount > 0) | Amount billed by provider |
| `approved_amount` | NUMERIC(10,2) | CHECK (approved_amount > 0 AND approved_amount <= billed_amount) | Amount approved by payer |
| `denial_reason_code` | VARCHAR(50) | | Denial reason code if denied |
| `denial_explanation` | TEXT | | Detailed denial explanation |
| `adjudication_notes` | TEXT | | Payer notes on decision |
| `adjudicated_by_user_id` | UUID | FOREIGN KEY → users(id) | Payer user who adjudicated |
| `adjudicated_at` | TIMESTAMP | | Timestamp of adjudication |
| `submitted_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Claim submission timestamp |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_claims_number` on `claim_number` (for lookups)
- `idx_claims_provider` on `provider_id` (for provider dashboard)
- `idx_claims_status` on `status` (for filtering)
- `idx_claims_submitted_user` on `submitted_by_user_id` (for user's claims)
- `idx_claims_service_date` on `service_date` (for date range queries)
- `idx_claims_composite` on `(provider_id, status, submitted_at)` (for dashboard queries)

**Sample Data:**
```sql
INSERT INTO claims (
  claim_number, provider_id, submitted_by_user_id,
  patient_first_name, patient_last_name, patient_dob, patient_member_id,
  cpt_code, icd10_code, service_date, billed_amount, status
) VALUES (
  'CLM-20251015-0001',
  '<provider_uuid>',
  '<user_uuid>',
  'John',
  'Smith',
  '1975-03-15',
  'MEM123456789',
  '99213',
  'E11.9',
  '2025-10-10',
  150.00,
  'submitted'
);
```

---

### 5. `audit_log`

Tracks all actions on claims for compliance and troubleshooting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique log entry identifier |
| `claim_id` | UUID | NOT NULL, FOREIGN KEY → claims(id) | Associated claim |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → users(id) | User who performed action |
| `action` | VARCHAR(50) | NOT NULL | Action type (e.g., 'submitted', 'approved', 'denied', 'viewed') |
| `old_status` | VARCHAR(20) | | Previous claim status (for status changes) |
| `new_status` | VARCHAR(20) | | New claim status (for status changes) |
| `details` | JSONB | | Additional action details (flexible structure) |
| `ip_address` | VARCHAR(45) | | User IP address (IPv4/IPv6) |
| `user_agent` | TEXT | | Browser user agent string |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of action |

**Indexes:**
- `idx_audit_claim` on `claim_id` (for claim history)
- `idx_audit_user` on `user_id` (for user activity)
- `idx_audit_created` on `created_at` (for time-based queries)

**Sample Data:**
```sql
INSERT INTO audit_log (claim_id, user_id, action, new_status, details) VALUES
('<claim_uuid>', '<user_uuid>', 'submitted', 'submitted', '{"billed_amount": 150.00}'),
('<claim_uuid>', '<payer_user_uuid>', 'approved', 'approved', '{"approved_amount": 150.00, "notes": "Approved as submitted"}');
```

---

## 🔗 Relationships & Foreign Keys

### Foreign Key Constraints

```sql
-- Users to Providers
ALTER TABLE users
  ADD CONSTRAINT fk_users_provider
  FOREIGN KEY (provider_id) REFERENCES providers(id)
  ON DELETE RESTRICT;  -- Cannot delete provider with active users

-- Users to Payers
ALTER TABLE users
  ADD CONSTRAINT fk_users_payer
  FOREIGN KEY (payer_id) REFERENCES payers(id)
  ON DELETE RESTRICT;

-- Claims to Providers
ALTER TABLE claims
  ADD CONSTRAINT fk_claims_provider
  FOREIGN KEY (provider_id) REFERENCES providers(id)
  ON DELETE RESTRICT;  -- Cannot delete provider with claims

-- Claims to Submitting User
ALTER TABLE claims
  ADD CONSTRAINT fk_claims_submitted_by
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id)
  ON DELETE RESTRICT;

-- Claims to Adjudicating User
ALTER TABLE claims
  ADD CONSTRAINT fk_claims_adjudicated_by
  FOREIGN KEY (adjudicated_by_user_id) REFERENCES users(id)
  ON DELETE SET NULL;  -- If user deleted, keep claim but null out adjudicator

-- Audit Log to Claims
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_claim
  FOREIGN KEY (claim_id) REFERENCES claims(id)
  ON DELETE CASCADE;  -- If claim deleted, delete audit entries

-- Audit Log to Users
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;  -- If user deleted, keep log but null out user
```

---

## 📐 Data Validation Rules

### Business Logic Constraints

**Claims Table:**
- `patient_dob` must be at least 1 day old and no more than 120 years ago
- `service_date` must be within the last 365 days and not in the future
- `approved_amount` cannot exceed `billed_amount`
- When `status = 'approved'`, `approved_amount` must NOT be NULL
- When `status = 'denied'`, `denial_reason_code` must NOT be NULL
- `adjudicated_at` must be >= `submitted_at`

**Users Table:**
- Email must be valid format (enforced at application level)
- Password must be at least 8 characters (enforced at application level)
- `provider_id` and `payer_id` are mutually exclusive (CHECK constraint)

---

## 🎯 Common Query Patterns

### 1. Provider Dashboard — Get My Claims

```sql
SELECT 
  c.claim_number,
  c.patient_first_name || ' ' || c.patient_last_name AS patient_name,
  c.service_date,
  c.billed_amount,
  c.status,
  c.submitted_at
FROM claims c
WHERE c.submitted_by_user_id = :user_id
ORDER BY c.submitted_at DESC;
```

### 2. Payer Queue — Get Submitted Claims

```sql
SELECT 
  c.claim_number,
  p.name AS provider_name,
  c.patient_first_name || ' ' || c.patient_last_name AS patient_name,
  c.service_date,
  c.billed_amount,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - c.submitted_at)) AS days_pending
FROM claims c
JOIN providers p ON c.provider_id = p.id
WHERE c.status = 'submitted'
ORDER BY c.submitted_at ASC;
```

### 3. Claim Detail with Audit Trail

```sql
SELECT 
  c.*,
  p.name AS provider_name,
  submitter.email AS submitted_by_email,
  adjudicator.email AS adjudicated_by_email
FROM claims c
JOIN providers p ON c.provider_id = p.id
JOIN users submitter ON c.submitted_by_user_id = submitter.id
LEFT JOIN users adjudicator ON c.adjudicated_by_user_id = adjudicator.id
WHERE c.id = :claim_id;

-- Get audit history
SELECT 
  al.action,
  al.old_status,
  al.new_status,
  al.details,
  al.created_at,
  u.email AS performed_by
FROM audit_log al
JOIN users u ON al.user_id = u.id
WHERE al.claim_id = :claim_id
ORDER BY al.created_at ASC;
```

---

## 🔐 Security Considerations

### Row-Level Security (Future Enhancement)

PostgreSQL Row-Level Security (RLS) policies can enforce:
- Provider users see only claims where `submitted_by_user_id` matches their user ID
- Payer users see all claims
- Admin users see everything

**Example Policy:**
```sql
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_claims_policy ON claims
  FOR SELECT
  TO provider_staff_role
  USING (submitted_by_user_id = current_user_id());
```

---

## 📊 Database Migration Strategy

### Initial Schema Creation

1. Create tables in dependency order:
   - `providers`
   - `payers`
   - `users`
   - `claims`
   - `audit_log`

2. Add indexes after initial data load (for performance)

3. Seed with sample data for development/testing

### Version Control

- Use migration tool (e.g., Flyway, Liquibase, or Prisma Migrate)
- Each schema change gets a versioned migration file
- Migrations are idempotent and reversible

---

## 🧪 Sample Data Set

For development and demo purposes, seed database with:
- 2 Providers (Louisville Primary Care, Memorial Hospital)
- 2 Payers (Humana, UnitedHealthcare)
- 4 Users (2 provider staff, 2 payer processors)
- 20 Claims (mix of submitted, approved, denied statuses)
- 60+ Audit Log entries

---

## 📈 Performance Optimization

### Indexing Strategy

**Primary Indexes (already defined):**
- All foreign keys
- Frequently filtered columns (`status`, `service_date`)
- Composite index on common query patterns

**Future Optimizations:**
- Partition `claims` table by `submitted_at` (monthly partitions) if volume grows
- Materialize aggregate views for analytics dashboard
- Consider read replicas for reporting queries

---

## 🔄 Future Schema Enhancements

**Phase 2 (Post-MVP):**
- `claim_attachments` table — Store supporting documents
- `claim_appeals` table — Track resubmissions
- `eligibility_checks` table — Pre-submission verifications
- `remittance_advice` table — Payment details

**Phase 3 (Advanced):**
- `claim_line_items` table — Support multi-service claims
- `authorization_requests` table — Prior authorization workflow
- `provider_contracts` table — Reimbursement rate rules

---

**End of Data Model Specification**

*This schema supports the MVP scope defined in the PRD and user stories. It is designed for extensibility to accommodate future enhancements.*
