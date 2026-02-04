# Project Overview: Claims Management System

> **Purpose:** This document provides context for AI-assisted development tools (like Claude Code) to understand the project's goals, domain, and constraints.

---

## 🎯 What We're Building

A **lightweight Claims Management System (CMS)** that simulates real-world healthcare claims processing workflows.

**Core Purpose:**
- Educational/portfolio project demonstrating product management skills
- Functional prototype showing understanding of payer-provider claims flows
- Showcase for AI-assisted product development

---

## 🏥 Domain Context: Healthcare Claims Processing

### Key Entities
1. **Provider** — Hospitals, clinics, or physicians who deliver patient care
2. **Payer** — Insurance companies (e.g., Humana, UnitedHealthcare) who reimburse providers
3. **CMS** — Centers for Medicare & Medicaid Services (government entity managing federal healthcare programs)

### The Claims Flow (Simplified)
```
Patient receives care at Provider
    ↓
Provider submits claim to Payer (with CPT codes, ICD-10 diagnosis, patient info)
    ↓
Payer adjudicates claim (verifies eligibility, coverage, calculates reimbursement)
    ↓
Payer approves/denies claim
    ↓
For Medicare/Medicaid: Payer forwards approved claims to CMS for reimbursement
    ↓
Payer sends remittance advice to Provider (payment details)
```

### Real-World Complexity (We're Simplifying)
- Actual systems handle millions of claims per day
- Complex eligibility rules, prior authorization, appeals processes
- HIPAA compliance, EDI 837/835 formats, integration with clearinghouses
- **Our MVP:** Focus on core submission → adjudication → approval/denial flow

---

## 👥 User Personas (Simplified for MVP)

### 1. Provider User (Primary)
- **Role:** Claims submission specialist at a clinic
- **Goal:** Submit claims quickly, track status, understand denials
- **Pain Points:** Manual data entry, unclear denial reasons, delayed payments

### 2. Payer User (Claims Processor)
- **Role:** Claims adjudicator at insurance company
- **Goal:** Review claims efficiently, apply coverage rules, minimize fraud
- **Pain Points:** High claim volume, complex eligibility rules, provider disputes

### 3. System Admin (Internal)
- **Role:** IT/Operations team managing the platform
- **Goal:** Monitor system health, manage user accounts, troubleshoot issues

---

## 🔧 MVP Scope (Phase 1)

### Core Workflows
1. **Claims Submission** (Provider → Payer)
   - Provider enters claim data via web form
   - System validates required fields
   - Claim status set to "Submitted"

2. **Claims Adjudication** (Payer reviews)
   - Payer sees queue of submitted claims
   - Can approve (set reimbursement amount) or deny (with reason)
   - Claim status updates to "Approved" or "Denied"

3. **Claims Status Tracking** (Provider checks)
   - Provider can view list of their submitted claims
   - See current status and any payer notes

### Out of Scope (for MVP)
- Eligibility verification API
- Real-time CMS forwarding
- EDI file parsing (we'll use manual forms)
- Appeals/resubmission workflow
- Payment processing
- Real HIPAA compliance (we'll simulate with basic auth)

---

## 🗄️ Core Data Entities

### Claim
- **ID:** Unique identifier
- **Provider ID:** Who submitted
- **Patient Info:** Name, DOB, Member ID
- **Service Details:** CPT codes, diagnosis (ICD-10), service date, billed amount
- **Status:** Submitted | Under Review | Approved | Denied | Paid
- **Payer Decision:** Approved amount, denial reason, adjudication date

### Provider
- **ID:** Unique identifier
- **Name:** Clinic/hospital name
- **NPI:** National Provider Identifier
- **Contact Info:** Email, phone

### Payer
- **ID:** Unique identifier
- **Name:** Insurance company name
- **Contact Info:** Email, phone

### User
- **ID:** Unique identifier
- **Email:** Login credential
- **Phone Number:** Contact phone (optional)
- **Role:** Provider Staff | Payer Claims Processor | Admin
- **Associated Entity:** Provider ID or Payer ID

---

## 🏗️ Technical Approach

### Architecture Style
- **Frontend:** Web app (React or Vue.js) — responsive, form-heavy
- **Backend:** REST API (Node.js/Express or Python/Flask)
- **Database:** PostgreSQL or MongoDB
- **Deployment:** Docker containers, eventually Kubernetes

### Key Principles
- **Stateful:** Claims persist in database with status transitions
- **Role-based access:** Providers see only their claims, Payers see all claims for their org
- **Audit trail:** Track who changed claim status and when
- **API-first:** Frontend consumes backend API (allows future mobile app)

---

## 🤖 Smart Automation Features

### Automated UML Diagram Maintenance
This repository includes an intelligent documentation system with **18+ UML diagrams** that stay synchronized with the codebase:

**Key Features:**
- **Multi-audience design:** Separate diagram views for business stakeholders, architects, and developers
- **Git hook automation:** Pre-commit hooks detect code changes and remind which diagrams need updating
- **Validation system:** Commit blocked if diagrams aren't updated alongside code changes
- **Smart detection:** Monitors Prisma schema, routes, controllers for relevant changes

**Location:** `docs/SYSTEM_UML_DIAGRAMS.md`

**Usage:**
```bash
# Check diagram status
node scripts/update-uml-diagrams.js --check

# Git hook automatically reminds during commit
git commit -m "Change schema"
# → ⚠️ Schema changed! Update Class Diagram + ERD
```

### Automated Multi-Audience Email Notifications
Release notifications are automatically generated and sent to stakeholders:

**Key Features:**
- **Three tailored email templates:** Business stakeholders, System architects, Developers
- **CHANGELOG-driven:** Content extracted from multi-audience CHANGELOG.md
- **Gmail SMTP integration:** Automatically sends emails via configured Gmail account
- **Post-commit automation:** Prompts to send notifications when CHANGELOG.md updates

**Recipients (configured):**
- Business: High-level summaries, user impact
- Architects: Architecture changes, infrastructure updates
- Developers: API changes, migration guides, code references

**Location:** `scripts/send-release-notifications.js`, `email-templates/`

**Usage:**
```bash
# Update CHANGELOG and commit
git commit -m "Release v1.2.0"
# → Post-commit hook prompts: "Send notifications? [y/d/l/n]"

# Manual send
node scripts/send-release-notifications.js --version=1.2.0
```

### What's Automated vs Manual

**Automated:**
- ✅ UML diagram staleness detection and reminders
- ✅ UML diagram update validation (blocks commit if not updated)
- ✅ Email notification generation from CHANGELOG
- ✅ SMTP email sending to configured recipients

**Manual (intentionally):**
- ❌ PRD.md updates (requires business context)
- ❌ API_CONTRACTS.md updates (requires design decisions)
- ❌ CHANGELOG.md content (requires human-written release notes)
- ❌ Diagram content edits (requires architectural judgment)

**See:** `AUTOMATION_STATUS.md` for complete details on automation scope

---

## 🚫 Constraints & Guardrails

### What to Avoid
- **No real PHI/PII:** Use dummy patient data only
- **No real payment processing:** Simulate with status updates
- **No production security:** Basic auth is fine (not OAuth2)
- **No over-engineering:** Prioritize working prototype over perfect code

### What to Prioritize
- **Clear data flow:** Easy to trace a claim from submission to adjudication
- **Readable code:** Well-commented, modular, easy for non-devs to understand
- **Extensibility:** Structure allows adding features (eligibility check, appeals) later

---

## 📋 Success Criteria

This MVP is successful if:
1. A provider user can submit a claim via web form
2. A payer user can review and approve/deny the claim
3. The provider can see the updated status
4. All data persists correctly in the database
5. The system can be demo'd in an interview/portfolio review

---

## 🧠 AI Development Context

When generating code for this project:
- **Read the PRD first** (`/docs/PRD.md`) for feature requirements
- **Check the data model** (`/architecture/DATA_MODEL.md`) for entity structure
- **Follow API contracts** (`/architecture/API_CONTRACTS.md`) for endpoint specs
- **Apply coding guidelines** (`/context-for-ai/CODING_GUIDELINES.md`) for consistency
- **Review UML diagrams** (`docs/SYSTEM_UML_DIAGRAMS.md`) for system architecture
- **Check automation status** (`AUTOMATION_STATUS.md`) for what's automated vs manual

**For context continuity across sessions:**
- **Read SESSION_SUMMARY.md** for latest work completed
- **Check AUTOMATION_STATUS.md** for automation scope understanding
- **Review CHANGELOG.md** for recent changes and releases

**Remember:** This is a learning project. Prioritize clarity and functionality over optimization.

---

**Document Owner:** rdevarakond88
**Last Updated:** 2026-02-03
**Status:** Living document (will evolve through development phases)
