# User Stories & Acceptance Criteria
## Claims Management System (CMS)

**Document Owner:** rdevarakond88  
**Last Updated:** October 2025  
**Status:** Active Backlog

---

## 📋 Story Prioritization

- **P0** — Must-have for MVP (demo-critical)
- **P1** — Nice-to-have (post-MVP enhancement)
- **P2** — Future consideration

---

## 🎯 Epic 1: User Authentication & Authorization

### US-001: User Login [P0]
**As a** system user (Provider or Payer staff)  
**I want to** log in with my email and password  
**So that** I can access my role-specific dashboard

**Acceptance Criteria:**
- Login page has email and password fields
- System validates credentials against user database
- Successful login redirects to role-appropriate dashboard
- Failed login shows clear error message
- Passwords are hashed in database (bcrypt)
- Session expires after 30 minutes of inactivity

---

### US-002: Role-Based Access Control [P0]
**As a** system administrator  
**I want** users to see only data relevant to their role  
**So that** providers can't see other providers' claims and payers can't modify provider data

**Acceptance Criteria:**
- Provider users see only claims they submitted
- Payer users see all submitted claims
- Admin users see all data and user management panel
- Unauthorized access attempts return 403 Forbidden
- User role is validated on every API request

---

## 🏥 Epic 2: Claims Submission (Provider Workflow)

### US-003: Submit New Claim [P0]
**As a** Provider Claims Specialist  
**I want to** submit a claim with patient and service details  
**So that** I can request reimbursement for services provided

**Acceptance Criteria:**
- Form includes sections for:
  - Patient Info: Name, Date of Birth, Member ID
  - Service Details: CPT code, ICD-10 diagnosis code, Service Date, Billed Amount
  - Provider Info: Auto-populated from logged-in user profile
- All required fields are validated before submission
- System generates unique Claim ID (format: CLM-YYYYMMDD-####)
- Claim status is automatically set to "Submitted"
- User sees confirmation message with Claim ID
- Submitted claim appears in provider's claim list immediately

**Validation Rules:**
- Patient Name: Required, max 100 characters
- DOB: Required, must be valid date, patient must be under 120 years old
- Member ID: Required, alphanumeric, 8-15 characters
- CPT Code: Required, 5 digits (e.g., 99213)
- ICD-10: Required, valid format (e.g., E11.9)
- Service Date: Required, cannot be future date, within last 365 days
- Billed Amount: Required, positive number, max $999,999.99

---

### US-004: View My Submitted Claims [P0]
**As a** Provider Claims Specialist  
**I want to** view a list of all claims I've submitted  
**So that** I can track their status and follow up if needed

**Acceptance Criteria:**
- Dashboard shows table of claims with columns:
  - Claim ID
  - Patient Name
  - Service Date
  - Billed Amount
  - Current Status (badge with color coding)
  - Submitted Date
- Default sort: Most recent first
- Clicking a row opens claim detail view
- Status badges use color coding:
  - Submitted: Blue
  - Under Review: Yellow
  - Approved: Green
  - Denied: Red

---

### US-005: View Claim Details [P0]
**As a** Provider Claims Specialist  
**I want to** view complete details of a specific claim  
**So that** I can see what was submitted and any payer decisions

**Acceptance Criteria:**
- Detail view shows all submitted data (read-only)
- Shows status history timeline with timestamps
- If denied, shows denial reason prominently
- If approved, shows approved amount vs billed amount
- Includes link to return to claim list
- Shows audit trail (who submitted, when adjudicated, by whom)

---

## 💼 Epic 3: Claims Adjudication (Payer Workflow)

### US-006: View Claims Queue [P0]
**As a** Payer Claims Processor  
**I want to** see all submitted claims pending review  
**So that** I can prioritize and process them efficiently

**Acceptance Criteria:**
- Dashboard shows table of all claims with status "Submitted"
- Columns include:
  - Claim ID
  - Provider Name
  - Patient Name
  - Service Date
  - Billed Amount
  - Days Since Submission
- Claims with "Days Since Submission" > 7 are highlighted
- Can sort by any column
- Clicking a claim opens adjudication detail view

---

### US-007: Approve Claim [P0]
**As a** Payer Claims Processor  
**I want to** approve a claim and set the reimbursement amount  
**So that** the provider knows the claim is accepted and payment will be issued

**Acceptance Criteria:**
- Adjudication view shows all claim details
- "Approve" button opens approval dialog
- Dialog includes:
  - Approved Amount field (defaults to billed amount, can be reduced)
  - Optional notes field (e.g., "Adjusted for copay")
- Approved amount cannot exceed billed amount
- Approved amount must be positive number
- On submit:
  - Claim status changes to "Approved"
  - Approved amount and adjudication date are saved
  - Timestamp and adjudicator user ID are logged
- Payer sees success message and returns to queue
- Provider can immediately see updated status

---

### US-008: Deny Claim [P0]
**As a** Payer Claims Processor  
**I want to** deny a claim with a clear reason  
**So that** the provider understands why and can correct issues

**Acceptance Criteria:**
- "Deny" button opens denial dialog
- Dialog includes:
  - Denial Reason dropdown with predefined codes:
    - Invalid CPT Code
    - Missing/Invalid Diagnosis
    - Service Not Covered
    - Patient Not Eligible
    - Duplicate Claim
    - Insufficient Documentation
    - Other (requires explanation)
  - Required explanation text field (min 20 characters)
- On submit:
  - Claim status changes to "Denied"
  - Denial reason and explanation are saved
  - Timestamp and adjudicator user ID are logged
- Payer sees success message and returns to queue
- Provider can see denial reason in claim details

---

## 📊 Epic 4: Status Tracking & Transparency

### US-009: Filter Claims by Status [P0]
**As a** user (Provider or Payer)  
**I want to** filter my claims list by status  
**So that** I can focus on claims needing attention

**Acceptance Criteria:**
- Filter dropdown above claim list with options:
  - All Claims (default)
  - Submitted
  - Approved
  - Denied
- Selecting a filter updates the table immediately
- Filter selection persists during session
- Count of claims shown for each status in dropdown

---

### US-010: Search Claims [P1]
**As a** user (Provider or Payer)  
**I want to** search for specific claims  
**So that** I can quickly find a claim without scrolling

**Acceptance Criteria:**
- Search bar above claim list
- Can search by:
  - Claim ID (exact match)
  - Patient Name (partial match)
  - Member ID (exact match)
- Search results update as user types (debounced)
- Clear search button resets to full list
- Shows "No results found" if search returns nothing

---

## 👤 Epic 5: User Management (Admin)

### US-011: Create New User [P0]
**As a** System Administrator
**I want to** create user accounts for providers and payers
**So that** new staff can access the system with proper security controls

**Acceptance Criteria:**
- Admin dashboard has "Add User" button
- Form includes:
  - Email (unique, validated format)
  - First Name (required, 1-100 chars)
  - Last Name (required, 1-100 chars)
  - Role (Provider Staff or Payer Processor)
  - Associated Organization (dropdown of Providers or Payers based on role)
- Temporary password is auto-generated (12+ chars, mixed case, numbers, symbols)
- On successful creation:
  - Temporary password displayed once in modal with copy button
  - Warning message: "Save this password - it will not be shown again"
  - Admin manually shares temp password with new user (simulates email for POC)
- New user appears in admin user list immediately
- User list shows: Email, Name, Role, Organization, Status, Created Date
- First-login flag set to TRUE for new users

**First Login Flow:**
- User logs in with email and temporary password
- Immediately redirected to "Set New Password" page (cannot access system until password changed)
- Set Password page requires:
  - Current temporary password (validation)
  - New password (min 8 chars, uppercase, lowercase, number)
  - Confirm new password (must match)
- After successful password change:
  - First-login flag set to FALSE
  - User redirected to role-appropriate dashboard
  - Can now use system normally

**Security Requirements:**
- Only users with `admin` role can access admin dashboard
- Non-admin users attempting to access admin routes get 403 Forbidden
- Temporary passwords are hashed before storage (same as regular passwords)
- First-login check enforced on every authenticated request
- Audit log entry created when admin creates user

**Validation Rules:**
- Email: Required, valid format (RFC 5322), unique in database
- First/Last Name: Required, 1-100 chars
- Role: Required, must be "provider_staff" or "payer_processor"
- Organization: Required, must be valid UUID from providers/payers table
- Organization must match role type (provider_staff → provider, payer_processor → payer)

**Edge Cases:**
- Handle organization dropdown loading errors gracefully
- Prevent duplicate submissions (disable button during API call)
- If user closes modal without saving temp password, they cannot retrieve it
- Admin can create a new account with same email if previous attempt failed

---

### US-012: View Audit Log [P1]
**As a** System Administrator  
**I want to** view a log of all claim actions  
**So that** I can troubleshoot issues and ensure compliance

**Acceptance Criteria:**
- Admin dashboard has "Audit Log" tab
- Log shows:
  - Timestamp
  - User (email)
  - Action (Submitted, Approved, Denied, Viewed)
  - Claim ID
  - Details (e.g., "Approved for $125.00")
- Can filter by date range, user, or action type
- Exportable as CSV

---

## 🔮 Future Enhancements (P2)

### US-013: Eligibility Check
**As a** Provider Claims Specialist  
**I want to** verify patient eligibility before submitting  
**So that** I don't waste time on claims for ineligible patients

---

### US-014: CMS Forwarding
**As a** Payer system
**I want to** automatically forward approved Medicare/Medicaid claims to CMS
**So that** we receive reimbursement from the government

---

### US-015: AI-Powered Claim Priority Categorization [P0] 🆕
**As a** Payer Claims Processor
**I want** claims automatically categorized by priority level
**So that** I can review urgent claims first and optimize processing efficiency

**Acceptance Criteria:**

✅ **AI Categorization During Submission:**
- When a provider submits a claim, AI analyzes CPT code, ICD-10 code, and billed amount
- AI assigns priority within 2 seconds: `urgent`, `standard`, or `routine`
- Priority is stored in database before claim record is created
- If AI service fails, claim defaults to "standard" priority with error logged
- AI reasoning is stored for transparency

✅ **Priority Levels:**
- 🔴 **Urgent**: Emergency procedures (CPT 99281-99285), critical diagnoses, high-cost claims (>$5,000), time-sensitive treatments
- 🟡 **Standard**: Routine hospitalizations, moderate-cost procedures ($500-$5,000), non-emergency medically necessary care
- 🟢 **Routine**: Preventive care, annual checkups, low-cost procedures (<$500), non-urgent follow-ups

✅ **Payer Queue Enhancements:**
- Priority appears as a colored badge next to each claim in the queue
- Queue automatically sorted by priority (Urgent → Standard → Routine), then by submission date
- Payer can filter queue by specific priority level
- Visual indicator for urgent claims that have been waiting >24 hours

✅ **Provider Transparency:**
- Provider sees assigned priority in claim confirmation message
- Priority visible in claim details view with tooltip explaining reasoning
- Priority badge shown in provider's claim list

✅ **Audit Trail:**
- All AI categorization decisions logged in audit_log table
- Log includes: priority assigned, confidence score, reasoning, timestamp
- Admin can review AI decisions for accuracy validation

**Technical Requirements:**

**Database Changes:**
- Add `priority` field to Claims table (enum: 'urgent', 'standard', 'routine')
- Default value: 'standard'
- Create composite index on (priority, created_at) for efficient queue sorting
- Add check constraint to validate priority values

**Backend Changes:**
- Create `aiCategorizationService` module with `categorizeClaim()` function
- Integrate Anthropic Claude API for categorization
- Update `POST /api/claims` endpoint to call AI service before saving claim
- Implement graceful fallback on AI service failure
- Add timeout (5 seconds max) for AI calls
- Update `GET /api/claims` endpoint to sort by priority by default
- Log all AI decisions in audit_log with details JSON

**Frontend Changes:**
- Add priority badge component (red/yellow/green with icons)
- Update payer claims queue to display priority badges
- Modify queue sorting logic to prioritize by priority level
- Add priority filter dropdown to queue view
- Show priority in claim detail view with reasoning tooltip
- Display priority in provider claim confirmation screen

**Test Scenarios:**

1. **Emergency claim** (CPT 99285, ICD-10 I21.9 [heart attack], $8,500)
   → Should categorize as **Urgent** with high confidence

2. **Routine checkup** (CPT 99213, ICD-10 Z00.00 [general exam], $150)
   → Should categorize as **Routine**

3. **Standard procedure** (CPT 70450 [CT scan], ICD-10 R51 [headache], $800)
   → Should categorize as **Standard**

4. **API failure** (Network timeout or service error)
   → Should default to **Standard**, log error, continue claim submission without blocking

5. **High-cost non-emergency** (CPT 27447 [knee replacement], ICD-10 M17.11 [osteoarthritis], $25,000)
   → Should categorize as **Urgent** due to high cost despite non-emergency nature

**Success Metrics:**
- 95%+ AI categorization accuracy (validated against manual review sample of 50 claims)
- Payers process urgent claims within 24 hours (vs. baseline average of 3-5 days)
- Average time-to-payment reduced by 30% for high-priority claims
- Provider satisfaction score for categorization transparency >4/5
- AI service uptime >99.5% with graceful fallback

**Dependencies:**
- Anthropic Claude API access and API key
- Database migration completed before deployment
- UI component library supports colored badges

**Future Enhancements:**
- Manual override capability for payers to change priority
- Historical learning (improve AI based on adjudication outcomes)
- Priority escalation rules (auto-escalate claims aging >7 days)
- Batch re-categorization tool for admin users

---

### US-016: Appeal Denied Claim
**As a** Provider Claims Specialist
**I want to** submit an appeal for a denied claim with additional documentation
**So that** I can get claims reconsidered

---

### US-017: Bulk Claim Upload
**As a** Provider Claims Specialist
**I want to** upload multiple claims via CSV file
**So that** I can submit high volumes efficiently

---

### US-018: Email Notifications
**As a** Provider Claims Specialist
**I want to** receive email alerts when my claims are adjudicated
**So that** I don't have to constantly check the portal

---

### US-019: Analytics Dashboard
**As a** Payer Manager
**I want to** see aggregate metrics (approval rate, avg processing time, denial reasons)
**So that** I can identify process improvements

---

## 📊 MVP Story Summary

**Total Stories:** 19 (updated with AI categorization)
**MVP Scope (P0):** 12 stories (includes US-015: AI Categorization)
**Post-MVP (P1):** 1 story
**Future (P2):** 6 stories

### MVP Story Breakdown by Epic
- Authentication: 2 stories
- Claims Submission: 3 stories
- Claims Adjudication: 3 stories
- Status Tracking: 2 stories
- User Management: 1 story
- AI Features: 1 story 🆕

**Estimated MVP Complexity:**
- Small (1-2 days): US-001, US-002, US-004, US-005, US-009
- Medium (3-5 days): US-003, US-006, US-007, US-008, US-011
- Large (5-7 days): US-015 (AI Categorization) 🆕

---

## 🎯 Development Order Recommendation

**Sprint 1: Foundation (Week 1-2)**
1. Database schema setup
2. US-001: User Login
3. US-002: Role-Based Access Control
4. US-011: Create New User (Admin provisioning with temp password)

**Sprint 2: Provider Flow (Week 3-4)**
5. US-003: Submit New Claim
6. US-004: View My Submitted Claims
7. US-005: View Claim Details

**Sprint 3: Payer Flow (Week 5-6)**
8. US-006: View Claims Queue
9. US-007: Approve Claim
10. US-008: Deny Claim

**Sprint 4: AI Integration & Polish (Week 7-9)** 🆕
11. US-015: AI-Powered Claim Priority Categorization
    - Database migration for priority field
    - AI service integration
    - UI updates for priority badges
    - Testing and validation
12. US-009: Filter Claims by Status (including priority filter)
13. End-to-end testing with AI categorization
14. Bug fixes and UI refinements

---

**End of User Stories Document**

*This backlog will be refined iteratively as development progresses and new insights emerge.*
