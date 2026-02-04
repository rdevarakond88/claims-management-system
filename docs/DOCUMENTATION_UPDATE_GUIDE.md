# Documentation Update Guide

> **Purpose:** This guide explains which documentation files need updating when making specific types of code changes.
>
> **Last Updated:** 2026-02-03
> **For:** Developers and AI assistants maintaining this repository

---

## 📋 Quick Reference Table

| Change Type | Files to Update | Priority |
|------------|-----------------|----------|
| **Add/Modify Database Field** | Prisma schema, DATABASE_SCHEMA.md, DATA_MODEL.md, SYSTEM_UML_DIAGRAMS.md (ERD + Class), API_CONTRACTS.md, PRD.md | Critical |
| **Add/Modify API Endpoint** | API_CONTRACTS.md (both versions), SYSTEM_UML_DIAGRAMS.md (API Map + Sequences), PRD.md (API Requirements) | Critical |
| **Add New Feature** | PRD.md, USER_STORIES.md, CHANGELOG.md, README.md | Critical |
| **Change Business Logic** | PRD.md, SYSTEM_UML_DIAGRAMS.md (workflows), DATA_MODEL.md (business rules) | High |
| **Add User Field** | See [Adding User Fields](#adding-user-fields) section | Critical |
| **Modify Authentication** | PRD.md (FR-1), API_CONTRACTS.md (auth endpoints), ADMIN_USER_PROVISIONING.md | Critical |
| **Update Dependencies** | CHANGELOG.md, PRD.md (Dependencies section) | Medium |

---

## 🔄 Common Change Scenarios

### Adding User Fields

**Example:** Adding `phoneNumber` field to User model

**Files to Update:**

1. **backend/prisma/schema.prisma** (CODE)
   ```prisma
   model User {
     // ... existing fields
     phoneNumber  String?  @map("phone_number")
   }
   ```

2. **docs/SYSTEM_UML_DIAGRAMS.md** (DOCUMENTATION)
   - Update Class Diagram → User class attributes
   - Update ERD → users table columns
   - Triggered by: Pre-commit git hook (automated reminder)

3. **docs/PRD.md** (DOCUMENTATION)
   - Section 8: Data Requirements → Users entity
   - Add field to entity description

4. **architecture/API_CONTRACTS.md** (DOCUMENTATION)
   - Login response (POST /api/v1/auth/login)
   - GET /api/v1/auth/me response
   - GET /api/v1/users/profile response
   - POST /api/v1/admin/users request + response
   - POST /api/v1/auth/set-password response

5. **docs/API_CONTRACTS.md** (DOCUMENTATION)
   - Login response (POST /api/auth/login)
   - GET /api/users/profile response
   - POST /api/admin/users request + response

6. **architecture/DATA_MODEL.md** (DOCUMENTATION)
   - Table 3: users → Add column definition
   - Sample data SQL queries

7. **docs/DATABASE_SCHEMA.md** (DOCUMENTATION)
   - Table 3: users → Add column with type and constraints

8. **docs/USER_STORIES.md** (DOCUMENTATION)
   - US-011: Create New User → Form fields
   - US-011: Validation Rules

9. **docs/ADMIN_USER_PROVISIONING.md** (DOCUMENTATION)
   - createUser function → req.body destructuring
   - createUser function → service call parameters
   - validateUserInput function → validation logic

10. **context-for-ai/PROJECT_OVERVIEW.md** (DOCUMENTATION)
    - Core Data Entities → User entity

11. **CHANGELOG.md** (DOCUMENTATION)
    - Add entry for next release with multi-audience details
    - Triggers: Post-commit email notifications

---

### Adding New API Endpoint

**Example:** Adding `POST /api/v1/claims/:id/notes`

**Files to Update:**

1. **backend/src/routes/claims.ts** (CODE)
   - Add route handler

2. **backend/src/controllers/claimsController.ts** (CODE)
   - Add controller function

3. **docs/SYSTEM_UML_DIAGRAMS.md** (DOCUMENTATION)
   - API Endpoint Map diagram
   - Sequence diagram for notes workflow
   - Triggered by: Pre-commit git hook

4. **architecture/API_CONTRACTS.md** (DOCUMENTATION)
   - Add new endpoint section with:
     - Description
     - Authorization requirements
     - Request body schema
     - Success response (200/201)
     - Error responses (400/403/404)

5. **docs/API_CONTRACTS.md** (DOCUMENTATION)
   - Same as above (both files exist)

6. **docs/PRD.md** (DOCUMENTATION)
   - Section 9: API Requirements → Add endpoint

7. **CHANGELOG.md** (DOCUMENTATION)
   - Developer section: API Updates

**Optional (if feature-related):**
- USER_STORIES.md → New user story or update existing
- PRD.md → Functional Requirements if new feature

---

### Modifying Database Schema

**Example:** Adding `priority` field to Claim model

**Files to Update:**

1. **backend/prisma/schema.prisma** (CODE)
   - Add field to model
   - Add enum if needed
   - Add index if needed

2. **docs/SYSTEM_UML_DIAGRAMS.md** (DOCUMENTATION)
   - Class Diagram → Claim class
   - ERD → claims table
   - Triggered by: Pre-commit git hook

3. **architecture/DATA_MODEL.md** (DOCUMENTATION)
   - claims table definition
   - Business rules section
   - Indexes section
   - Sample queries

4. **docs/DATABASE_SCHEMA.md** (DOCUMENTATION)
   - claims table definition
   - Prisma Schema Reference section (if shown)
   - Relationships (if affected)

5. **docs/PRD.md** (DOCUMENTATION)
   - Section 8: Data Requirements → Claims entity

6. **API_CONTRACTS.md** (both versions) (DOCUMENTATION)
   - Any endpoint returning Claim objects
   - Request bodies accepting Claim data

7. **CHANGELOG.md** (DOCUMENTATION)
   - Developer: Database Schema section
   - Architect: Architecture Changes section

**If feature-related:**
- PRD.md → Functional Requirements
- USER_STORIES.md → Related user stories

---

### Adding New Feature

**Example:** Adding claim notes/comments feature

**Files to Update:**

1. **CODE FILES**
   - Prisma schema (if DB changes)
   - Routes, controllers, services
   - Frontend components

2. **docs/PRD.md** (DOCUMENTATION)
   - Section 6: Functional Requirements → New FR section
   - Section 8: Data Requirements (if new entities)
   - Section 9: API Requirements (if new endpoints)
   - Section 10: UI/UX Requirements (if UI changes)

3. **docs/USER_STORIES.md** (DOCUMENTATION)
   - Add new user story with:
     - As a / I want to / So that
     - Acceptance criteria
     - Validation rules
     - Edge cases

4. **docs/SYSTEM_UML_DIAGRAMS.md** (DOCUMENTATION)
   - Workflow diagrams (if process changes)
   - Sequence diagrams (new interactions)
   - Component diagram (if architecture changes)
   - API endpoint map (if new endpoints)

5. **API_CONTRACTS.md** (both versions) (DOCUMENTATION)
   - New endpoints with full specifications

6. **architecture/DATA_MODEL.md** (DOCUMENTATION)
   - New entities or modified entities
   - Relationships
   - Business rules

7. **docs/DATABASE_SCHEMA.md** (DOCUMENTATION)
   - New tables or modified tables

8. **CHANGELOG.md** (DOCUMENTATION)
   - All three audience sections:
     - Business: What's New, Business Impact, User Experience
     - Architect: Architecture Changes, System Design
     - Developer: Technical Changes, API Updates, Testing

9. **README.md** (DOCUMENTATION)
   - Features section (if major feature)

---

## 📂 File Purpose Reference

### Product/Requirements Documentation

#### `docs/PRD.md` - Product Requirements Document
**Purpose:** Business requirements, functional specs, non-functional requirements

**Update when:**
- Adding new features
- Changing user-facing functionality
- Modifying business rules
- Adding data entities
- Adding API endpoints

**Key Sections:**
- Section 6: Functional Requirements
- Section 8: Data Requirements
- Section 9: API Requirements
- Section 10: UI/UX Requirements

---

#### `docs/USER_STORIES.md` - User Stories & Acceptance Criteria
**Purpose:** User-centric feature descriptions with testable acceptance criteria

**Update when:**
- Adding new user-facing features
- Modifying existing user workflows
- Changing form fields or validations
- Adding new user roles or permissions

**Format:**
```markdown
### US-XXX: [Feature Name] [Priority]
**As a** [role]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [Testable criteria]

**Validation Rules:**
- [Input validation]
```

---

### Architecture Documentation

#### `architecture/DATA_MODEL.md` - Data Model Specification
**Purpose:** Database schema with business context, relationships, and rules

**Update when:**
- Adding/modifying database tables
- Changing column definitions
- Modifying relationships
- Updating business rules

**Key Sections:**
- Table definitions with columns
- Constraints and indexes
- Relationships
- Business rules
- Sample data queries

---

#### `docs/DATABASE_SCHEMA.md` - Database Schema Reference
**Purpose:** Technical database schema documentation

**Update when:**
- Same as DATA_MODEL.md
- Changes to Prisma schema

**Key Sections:**
- Table definitions
- Relationships
- Indexes
- Prisma schema reference

---

### API Documentation

#### `architecture/API_CONTRACTS.md` - API Contracts (Architecture Version)
**Purpose:** Detailed API specification for backend developers

**Update when:**
- Adding new endpoints
- Modifying request/response schemas
- Changing authentication/authorization
- Updating error codes

**Format:**
```markdown
### [METHOD] `/api/v1/resource`

Description

**Authorization:** Role requirements

**Request:**
```json
{schema}
```

**Success Response (200):**
```json
{response}
```

**Error Responses:**
- 400, 401, 403, 404, etc.
```

---

#### `docs/API_CONTRACTS.md` - API Contracts (Docs Version)
**Purpose:** API reference for frontend developers and integrators

**Update when:**
- Same as architecture/API_CONTRACTS.md

**Note:** Maintain both versions with similar content but different formatting

---

### Diagrams & Visualization

#### `docs/SYSTEM_UML_DIAGRAMS.md` - UML Diagrams (Multi-Audience)
**Purpose:** Visual system documentation for all audiences

**Update when:**
- Adding/modifying database schema → ERD, Class Diagram
- Adding/modifying API endpoints → API Endpoint Map, Sequence Diagrams
- Changing workflows → Workflow diagrams
- Changing architecture → Component diagrams, C4 models

**Automated Reminders:** Pre-commit git hook detects changes and reminds which diagrams to update

**Key Diagrams:**
1. Business Audience: Context diagrams, User journeys, Workflows
2. Architect Audience: C4 models, Component diagrams, Deployment
3. Developer Audience: Class diagrams, ERD, API maps, Sequences

---

### Implementation Guides

#### `docs/ADMIN_USER_PROVISIONING.md` - Admin User Provisioning Implementation
**Purpose:** Detailed implementation guide for admin user management

**Update when:**
- Adding fields to user creation form
- Modifying user validation rules
- Changing first-login flow
- Updating temporary password logic

**Key Sections:**
- Controller functions (createUser)
- Validation functions (validateUserInput)
- Frontend form fields
- Test cases

---

### Context & AI Documentation

#### `context-for-ai/PROJECT_OVERVIEW.md` - Project Overview for AI
**Purpose:** High-level context for AI-assisted development

**Update when:**
- Major architectural changes
- Adding new core entities
- Changing tech stack
- Adding automation features

**Key Sections:**
- Core Data Entities
- Technical Approach
- Smart Automation Features
- AI Development Context

---

#### `SESSION_SUMMARY.md` - Session Context
**Purpose:** Continuity for AI sessions, recent work summary

**Update when:**
- Completing major work sessions
- Before ending Claude Code session
- After building significant features

---

#### `AUTOMATION_STATUS.md` - Automation Scope Documentation
**Purpose:** Clarifies what's automated vs manual

**Update when:**
- Adding new automation (hooks, scripts)
- Changing automation triggers
- Removing automation

---

### Release Documentation

#### `CHANGELOG.md` - Multi-Audience Release Notes
**Purpose:** Version history with tailored content for different stakeholders

**Update when:**
- Creating new release
- Making changes users/stakeholders need to know about

**Format:**
```markdown
## [VERSION] - YYYY-MM-DD

### 🎯 For Business Stakeholders
**What's New:**
**Business Impact:**
**User Experience:**

### 🏗️ For System Architects
**Architecture Changes:**
**Infrastructure Updates:**
**Security & Performance:**

### 👨‍💻 For Developers
**Technical Changes:**
**API Updates:**
**Database Schema:**
**Migration Guide:**
**Testing:**
```

**Triggers:** Post-commit git hook prompts for email notifications

---

#### `README.md` - Repository Overview
**Purpose:** First impression, getting started, features overview

**Update when:**
- Adding major features (visible in features list)
- Changing setup/installation process
- Adding automation capabilities
- Changing tech stack

---

## 🤖 Automated vs Manual Updates

### ✅ Automated (Git Hooks)

**UML Diagrams (`SYSTEM_UML_DIAGRAMS.md`):**
- **Trigger:** Pre-commit hook detects changes to:
  - `backend/prisma/schema.prisma`
  - `backend/src/routes/**`
  - `backend/src/controllers/**`
- **Action:** Reminds which diagrams to update
- **Validation:** Blocks commit if diagrams not updated

**Email Notifications:**
- **Trigger:** Post-commit hook detects `CHANGELOG.md` changes
- **Action:** Prompts to send multi-audience emails
- **Recipients:** Business stakeholders, architects, developers

### ❌ Manual (Requires Developer Action)

**All other documentation files:**
- PRD.md
- API_CONTRACTS.md
- DATA_MODEL.md
- DATABASE_SCHEMA.md
- USER_STORIES.md
- ADMIN_USER_PROVISIONING.md
- PROJECT_OVERVIEW.md
- README.md

**Why manual?**
These require human judgment about business context, design decisions, and architectural reasoning. Automated updates would lose quality and context.

---

## 🎯 Update Workflows

### Workflow 1: Adding a Database Field

```bash
# 1. Update Prisma schema
vim backend/prisma/schema.prisma
# Add field to model

# 2. Stage and try to commit
git add backend/prisma/schema.prisma
git commit -m "Add phoneNumber to User model"

# 3. Pre-commit hook triggers
# ⚠️  Schema changed! Update these diagrams:
#     - Class Diagram (User class)
#     - ERD (users table)

# 4. Update diagrams
vim docs/SYSTEM_UML_DIAGRAMS.md
# Update Class Diagram
# Update ERD

# 5. Update other documentation
vim docs/PRD.md                              # Data Requirements
vim architecture/API_CONTRACTS.md            # User endpoints
vim docs/API_CONTRACTS.md                    # User endpoints
vim architecture/DATA_MODEL.md               # Users table
vim docs/DATABASE_SCHEMA.md                  # Users table
vim docs/USER_STORIES.md                     # US-011 form fields
vim docs/ADMIN_USER_PROVISIONING.md          # createUser function
vim context-for-ai/PROJECT_OVERVIEW.md       # User entity

# 6. Commit all together
git add .
git commit -m "Add phoneNumber field to User model + update docs"
# ✓ Diagrams updated. Commit proceeding.

# 7. Update CHANGELOG for release
vim CHANGELOG.md
# Add multi-audience release notes

git add CHANGELOG.md
git commit -m "Release v1.2.0 - User phone numbers"

# 8. Post-commit hook triggers
# 📧 Send release notifications? [y/d/l/n]
# y = Send now
```

---

### Workflow 2: Adding a New Feature

```bash
# 1. Write user story
vim docs/USER_STORIES.md
# Add US-XXX with acceptance criteria

# 2. Update PRD
vim docs/PRD.md
# Add functional requirement
# Update data requirements if new entities
# Update API requirements if new endpoints

# 3. Design data model
vim architecture/DATA_MODEL.md
# Add new tables or update existing

vim docs/DATABASE_SCHEMA.md
# Mirror DATA_MODEL changes

# 4. Update Prisma schema
vim backend/prisma/schema.prisma
# Implement data model

# 5. Try to commit
git commit -m "Add data model for feature X"
# Pre-commit hook reminds to update diagrams

# 6. Update diagrams
vim docs/SYSTEM_UML_DIAGRAMS.md
# Update ERD, Class Diagram, etc.

# 7. Implement API
vim backend/src/routes/feature.ts
vim backend/src/controllers/featureController.ts

# 8. Commit API code
git commit -m "Implement API for feature X"
# Pre-commit hook reminds to update API diagrams

# 9. Update API documentation
vim architecture/API_CONTRACTS.md
vim docs/API_CONTRACTS.md
# Document all new endpoints

# 10. Update diagrams
vim docs/SYSTEM_UML_DIAGRAMS.md
# Update API Endpoint Map, Sequence Diagrams

# 11. Commit all documentation
git add .
git commit -m "Add feature X with complete documentation"

# 12. Create release notes
vim CHANGELOG.md
git commit -m "Release vX.Y.Z - Feature X"
# Post-commit hook prompts for emails
```

---

## 📝 Documentation Standards

### Required Sections for Documentation Updates

**When adding a database field:**
- [ ] Prisma schema
- [ ] UML diagrams (Class + ERD)
- [ ] DATA_MODEL.md table definition
- [ ] DATABASE_SCHEMA.md table definition
- [ ] API_CONTRACTS.md (all endpoints returning this entity)
- [ ] PRD.md Data Requirements

**When adding an API endpoint:**
- [ ] Route handler (code)
- [ ] Controller function (code)
- [ ] API_CONTRACTS.md (both versions) with full spec
- [ ] UML diagrams (API Map + Sequences)
- [ ] PRD.md API Requirements

**When adding a feature:**
- [ ] All of the above (if includes DB/API changes)
- [ ] USER_STORIES.md with acceptance criteria
- [ ] PRD.md Functional Requirements
- [ ] CHANGELOG.md multi-audience notes
- [ ] README.md (if major feature)

---

## 🚨 Common Mistakes to Avoid

### ❌ Updating code but forgetting documentation

**Problem:** Code changes committed without updating related docs

**Solution:** Use the checklist above before committing

---

### ❌ Updating only one API_CONTRACTS.md file

**Problem:** Two versions exist (docs/ and architecture/), only updating one

**Solution:** Update both files when modifying API contracts

---

### ❌ Skipping diagram updates

**Problem:** Bypassing pre-commit hook with --no-verify

**Solution:** Don't use --no-verify unless absolutely necessary. Update diagrams as prompted.

---

### ❌ Incomplete CHANGELOG entries

**Problem:** Only filling out one audience section in CHANGELOG

**Solution:** Fill out all three audience sections (Business, Architect, Developer) for every release

---

### ❌ Forgetting to update sample data

**Problem:** Adding database field but not updating SQL examples in DATA_MODEL.md

**Solution:** Update INSERT statements and sample queries when changing schema

---

## 📞 Quick Help

**Q: I added a field to Prisma schema. What do I update?**
A: See [Adding User Fields](#adding-user-fields) workflow

**Q: I added a new API endpoint. What do I update?**
A: See [Adding New API Endpoint](#adding-new-api-endpoint) workflow

**Q: Which files have automation?**
A: Only SYSTEM_UML_DIAGRAMS.md (reminder via git hook). See [Automated vs Manual](#-automated-vs-manual-updates)

**Q: Do I need to update both API_CONTRACTS.md files?**
A: Yes, both docs/ and architecture/ versions

**Q: Can I skip diagram updates?**
A: No, pre-commit hook will block your commit

**Q: What's the difference between DATA_MODEL.md and DATABASE_SCHEMA.md?**
A: DATA_MODEL.md has business context and rules. DATABASE_SCHEMA.md is technical reference. Update both.

---

## 🔗 Related Documentation

- `AUTOMATION_STATUS.md` - Details on what's automated vs manual
- `SESSION_SUMMARY.md` - Recent work and system state
- `docs/UML_MAINTENANCE_GUIDE.md` - Detailed UML diagram maintenance
- `docs/EMAIL_NOTIFICATIONS_GUIDE.md` - Email notification system

---

**Document Owner:** Development Team
**Last Updated:** 2026-02-03
**Version:** 1.0.0
