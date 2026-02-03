# System UML Diagrams
> **Multi-Audience Technical Documentation**
> Last Updated: 2026-02-03 (Fixed: Class Diagram enum rendering, User Roles diagram readability)
> Auto-Update Status: ✅ Enabled

---

## 📋 Table of Contents
- [For Business Stakeholders](#for-business-stakeholders)
- [For System Architects](#for-system-architects)
- [For Developers](#for-developers)
- [Diagram Maintenance Guide](#diagram-maintenance-guide)

---

## 🎯 For Business Stakeholders
> **Focus:** User workflows, business processes, and high-level system interactions

### 1. Business Context Diagram
**Purpose:** Shows how the system fits within the healthcare claims ecosystem

```mermaid
graph TB
    subgraph "External Entities"
        Patient[👤 Patient]
        CMS[🏛️ CMS<br/>Medicare/Medicaid]
    end

    subgraph "Claims Management System"
        Provider[🏥 Provider<br/>Hospital/Clinic]
        Payer[🏢 Payer<br/>Insurance Company]
        Admin[⚙️ System Admin]
    end

    Patient -->|Receives Care| Provider
    Provider -->|Submits Claims| Payer
    Payer -->|Forwards Medicare Claims| CMS
    Payer -->|Payment Decision| Provider
    Admin -->|Manages Users| Provider
    Admin -->|Manages Users| Payer

    style Patient fill:#e1f5ff
    style Provider fill:#c8e6c9
    style Payer fill:#fff9c4
    style CMS fill:#f8bbd0
    style Admin fill:#d1c4e9
```

### 2. User Journey - Claims Submission
**Purpose:** End-to-end flow from claim submission to payment decision

```mermaid
journey
    title Provider Claims Submission Journey
    section Submit Claim
      Login to system: 5: Provider
      Enter patient details: 3: Provider
      Add service codes (CPT): 3: Provider
      Add diagnosis (ICD-10): 4: Provider
      Submit claim: 5: Provider
    section Wait for Review
      Check claim status: 4: Provider
      Receive notification: 5: Provider
    section Resolution
      View approval/denial: 5: Provider
      Download remittance: 4: Provider
```

### 3. High-Level Workflow
**Purpose:** Simplified business process showing key decision points

```mermaid
stateDiagram-v2
    [*] --> Submitted: Provider submits claim
    Submitted --> UnderReview: Payer reviews claim

    UnderReview --> Approved: Claim valid
    UnderReview --> Denied: Issues found
    UnderReview --> PendingInfo: Need clarification

    PendingInfo --> UnderReview: Provider responds

    Approved --> Paid: Payment processed
    Denied --> [*]: Provider notified
    Paid --> [*]: Remittance sent

    note right of Approved
        Payer sets reimbursement amount
    end note

    note right of Denied
        Includes denial reason code
    end note
```

### 4. User Roles & Permissions
**Purpose:** Who can do what in the system

```mermaid
graph TB
    CMS[Claims Management System]

    subgraph "Provider Staff"
        PS1[Submit claims]
        PS2[View own claims]
        PS3[Track status]
        PS4[Download reports]
    end

    subgraph "Payer Claims Processor"
        PP1[View all claims]
        PP2[Approve/Deny claims]
        PP3[Set reimbursement]
        PP4[Add adjudication notes]
    end

    subgraph "System Admin"
        SA1[Provision users]
        SA2[Assign roles]
        SA3[View audit logs]
        SA4[Manage system config]
    end

    subgraph "CMS Proxy User - Future"
        CP1[View forwarded claims]
        CP2[Generate reports]
    end

    CMS --> PS1
    CMS --> PP1
    CMS --> SA1
    CMS -.-> CP1

    style CMS fill:#4CAF50,color:#fff
    style PS1 fill:#c8e6c9
    style PS2 fill:#c8e6c9
    style PS3 fill:#c8e6c9
    style PS4 fill:#c8e6c9
    style PP1 fill:#fff9c4
    style PP2 fill:#fff9c4
    style PP3 fill:#fff9c4
    style PP4 fill:#fff9c4
    style SA1 fill:#d1c4e9
    style SA2 fill:#d1c4e9
    style SA3 fill:#d1c4e9
    style SA4 fill:#d1c4e9
    style CP1 fill:#f8bbd0
    style CP2 fill:#f8bbd0
```

---

## 🏗️ For System Architects
> **Focus:** System design, data flow, infrastructure, and integration patterns

### 1. System Architecture (C4 Model - Level 1)
**Purpose:** Overall system context and external dependencies

```mermaid
graph TB
    subgraph "Claims Management System"
        Frontend[React Frontend<br/>Vite + TypeScript]
        Backend[Express.js API<br/>Node.js Runtime]
        DB[(PostgreSQL<br/>Relational Database)]
        Cache[Redis Cache<br/>Session Storage]
    end

    subgraph "External Services [Future]"
        EmailService[Email Service<br/>SendGrid/AWS SES]
        MonitoringService[Monitoring<br/>Sentry/DataDog]
    end

    User[👤 User Browser] -->|HTTPS| Frontend
    Frontend -->|REST API| Backend
    Backend -->|Prisma ORM| DB
    Backend -->|Session Management| Cache
    Backend -.->|Notifications| EmailService
    Backend -.->|Error Tracking| MonitoringService

    style Frontend fill:#61dafb
    style Backend fill:#68a063
    style DB fill:#336791
    style Cache fill:#dc382d
```

### 2. Component Architecture (C4 Model - Level 2)
**Purpose:** Internal system components and their relationships

```mermaid
graph TB
    subgraph "Frontend Components"
        UI[UI Components<br/>React Components]
        State[State Management<br/>React Context]
        APIClient[API Client<br/>Axios]
    end

    subgraph "Backend Components"
        Routes[API Routes<br/>Express Router]
        Controllers[Controllers<br/>Request Handlers]
        Services[Business Logic<br/>Service Layer]
        Middleware[Middleware<br/>Auth + Validation]
    end

    subgraph "Data Layer"
        Prisma[Prisma ORM<br/>Type-Safe Queries]
        Migrations[Database Migrations<br/>Schema Versioning]
    end

    UI --> State
    State --> APIClient
    APIClient -->|HTTP Requests| Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> Migrations

    style UI fill:#61dafb
    style Services fill:#68a063
    style Prisma fill:#2d3748
```

### 3. Data Flow - Claims Processing
**Purpose:** How data moves through the system during claim lifecycle

```mermaid
flowchart LR
    A[Provider UI] -->|POST /claims| B[Claims Controller]
    B -->|Validate| C[Claims Service]
    C -->|Create Record| D[(Database)]
    D -->|Return ID| C
    C -->|Response| B
    B -->|201 Created| A

    D -->|Query Claims| E[Payer Dashboard]
    E -->|PUT /claims/:id/adjudicate| F[Adjudication Controller]
    F -->|Business Rules| G[Adjudication Service]
    G -->|Update Status| D
    G -->|Create Audit Log| H[(Audit Table)]

    D -.->|Status Change| I[Notification Service]
    I -.->|Email/Alert| A

    style A fill:#c8e6c9
    style E fill:#fff9c4
    style D fill:#336791
    style H fill:#90caf9
```

### 4. Deployment Architecture
**Purpose:** Infrastructure and hosting environment

```mermaid
graph TB
    subgraph "Production Environment [Cloud]"
        LB[Load Balancer<br/>Nginx/AWS ALB]

        subgraph "Application Tier"
            App1[Frontend Container<br/>Port 3000]
            App2[Backend Container<br/>Port 5000]
        end

        subgraph "Data Tier"
            PrimaryDB[(Primary DB<br/>PostgreSQL)]
            RedisCluster[Redis Cluster<br/>Sessions]
        end

        subgraph "Monitoring"
            Logs[Centralized Logs<br/>CloudWatch/Datadog]
            Metrics[Metrics Dashboard<br/>Grafana]
        end
    end

    Internet[🌐 Internet] --> LB
    LB --> App1
    LB --> App2
    App2 --> PrimaryDB
    App2 --> RedisCluster
    App1 --> Logs
    App2 --> Logs
    App2 --> Metrics

    style LB fill:#ff9800
    style App1 fill:#61dafb
    style App2 fill:#68a063
    style PrimaryDB fill:#336791
    style RedisCluster fill:#dc382d
```

### 5. Security Architecture
**Purpose:** Authentication, authorization, and data protection

```mermaid
graph TB
    User[User Request] -->|HTTPS| WAF[Web Application Firewall]
    WAF -->|Rate Limiting| Frontend[Frontend App]
    Frontend -->|With Credentials| Auth[Auth Middleware]

    Auth -->|Validate Session| Redis[(Redis Session Store)]
    Redis -->|Session Valid| Auth
    Auth -->|Check Role| RBAC[Role-Based Access Control]

    RBAC -->|Authorized| Controller[API Controller]
    RBAC -->|Unauthorized| Error403[403 Forbidden]

    Controller -->|Sanitized Input| Service[Business Logic]
    Service -->|Parameterized Query| DB[(PostgreSQL)]

    subgraph "Security Layers"
        WAF
        Auth
        RBAC
    end

    style WAF fill:#f44336
    style Auth fill:#ff9800
    style RBAC fill:#ffc107
    style Redis fill:#dc382d
```

---

## 👨‍💻 For Developers
> **Focus:** Code structure, API flows, database schema, and implementation details

### 1. Class Diagram - Core Domain Models
**Purpose:** Entity relationships and data structure

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String passwordHash
        +Role role
        +String providerId?
        +String payerId?
        +String phoneNumber?
        +DateTime createdAt
        +login()
        +logout()
        +resetPassword()
    }

    class Provider {
        +String id
        +String name
        +String npi
        +String email
        +String phone
        +DateTime createdAt
        +submitClaim()
        +viewClaims()
    }

    class Payer {
        +String id
        +String name
        +String email
        +String phone
        +DateTime createdAt
        +adjudicateClaim()
        +viewAllClaims()
    }

    class Claim {
        +String id
        +String providerId
        +String patientName
        +String patientDob
        +String memberId
        +String cptCodes[]
        +String icd10Codes[]
        +Date serviceDate
        +Decimal billedAmount
        +Status status
        +Decimal approvedAmount?
        +String denialReason?
        +DateTime createdAt
        +DateTime updatedAt
        +submit()
        +approve()
        +deny()
        +updateStatus()
    }

    class AuditLog {
        +String id
        +String claimId
        +String userId
        +String action
        +JSON previousState
        +JSON newState
        +DateTime timestamp
        +log()
    }

    class Role {
        <<enumeration>>
        PROVIDER_STAFF
        PAYER_PROCESSOR
        ADMIN
    }

    class Status {
        <<enumeration>>
        SUBMITTED
        UNDER_REVIEW
        APPROVED
        DENIED
        PAID
    }

    User "1" --> "0..1" Provider : works_for
    User "1" --> "0..1" Payer : works_for
    Provider "1" --> "*" Claim : submits
    Payer "1" --> "*" Claim : adjudicates
    Claim "1" --> "*" AuditLog : tracks_changes
    User "1" --> "*" AuditLog : performs_action
    User --> Role : has
    Claim --> Status : has
```

### 2. Sequence Diagram - Claims Submission Flow
**Purpose:** Step-by-step API interaction for submitting a claim

```mermaid
sequenceDiagram
    actor Provider
    participant UI as Frontend UI
    participant API as Express API
    participant Auth as Auth Middleware
    participant Controller as Claims Controller
    participant Service as Claims Service
    participant DB as PostgreSQL
    participant Audit as Audit Service

    Provider->>UI: Fill claim form
    Provider->>UI: Click Submit

    UI->>API: POST /api/claims
    Note over UI,API: Headers: Cookie with session ID

    API->>Auth: Validate session
    Auth->>DB: Query session store
    DB-->>Auth: Session valid, user=provider123
    Auth->>Auth: Check role=PROVIDER_STAFF
    Auth-->>API: ✓ Authorized

    API->>Controller: createClaim(req, res)
    Controller->>Controller: Validate request body
    Controller->>Service: createClaim(claimData, userId)

    Service->>Service: Business validation<br/>(CPT codes format, dates)
    Service->>DB: INSERT INTO claims
    DB-->>Service: Claim ID: claim_xyz

    Service->>Audit: logClaimCreation(claimId, userId)
    Audit->>DB: INSERT INTO audit_logs

    Service-->>Controller: { id: claim_xyz, status: SUBMITTED }
    Controller-->>API: 201 Created
    API-->>UI: JSON response
    UI->>UI: Show success message
    UI->>UI: Redirect to claim details
    UI-->>Provider: "Claim submitted successfully"
```

### 3. Sequence Diagram - Claims Adjudication Flow
**Purpose:** Step-by-step API interaction for approving/denying a claim

```mermaid
sequenceDiagram
    actor Payer
    participant UI as Frontend UI
    participant API as Express API
    participant Auth as Auth Middleware
    participant Controller as Adjudication Controller
    participant Service as Adjudication Service
    participant ClaimService as Claims Service
    participant DB as PostgreSQL
    participant NotifService as Notification Service

    Payer->>UI: Review claim details
    Payer->>UI: Click Approve/Deny

    UI->>API: PUT /api/claims/:id/adjudicate
    Note over UI,API: Body: { decision: "APPROVED",<br/>approvedAmount: 500,<br/>notes: "..." }

    API->>Auth: Validate session
    Auth-->>API: ✓ Authorized (PAYER_PROCESSOR)

    API->>Controller: adjudicateClaim(req, res)
    Controller->>Service: processClaim(claimId, decision)

    Service->>ClaimService: getClaim(claimId)
    ClaimService->>DB: SELECT * FROM claims
    DB-->>ClaimService: Claim data
    ClaimService-->>Service: Claim object

    Service->>Service: Validate claim status<br/>(must be SUBMITTED)
    Service->>Service: Apply business rules<br/>(approved ≤ billed)

    Service->>DB: BEGIN TRANSACTION
    Service->>DB: UPDATE claims SET status, approvedAmount
    Service->>DB: INSERT INTO audit_logs
    Service->>DB: COMMIT

    DB-->>Service: Success
    Service->>NotifService: sendProviderNotification(claimId)

    Service-->>Controller: Updated claim object
    Controller-->>API: 200 OK
    API-->>UI: JSON response
    UI-->>Payer: "Claim adjudicated successfully"
```

### 4. API Endpoint Map
**Purpose:** Overview of all REST endpoints and their responsibilities

```mermaid
graph LR
    subgraph "Authentication Endpoints"
        Auth1[POST /api/auth/login]
        Auth2[POST /api/auth/logout]
        Auth3[GET /api/auth/me]
    end

    subgraph "Claims Endpoints"
        Claims1[GET /api/claims]
        Claims2[POST /api/claims]
        Claims3[GET /api/claims/:id]
        Claims4[PUT /api/claims/:id/adjudicate]
        Claims5[GET /api/claims/stats]
    end

    subgraph "User Management Endpoints"
        Users1[POST /api/admin/users]
        Users2[GET /api/admin/users]
        Users3[PUT /api/admin/users/:id]
        Users4[DELETE /api/admin/users/:id]
    end

    subgraph "Provider Endpoints"
        Prov1[GET /api/providers]
        Prov2[GET /api/providers/:id]
    end

    subgraph "Payer Endpoints"
        Pay1[GET /api/payers]
        Pay2[GET /api/payers/:id]
    end

    style Auth1 fill:#4caf50
    style Auth2 fill:#4caf50
    style Auth3 fill:#2196f3
    style Claims1 fill:#2196f3
    style Claims2 fill:#4caf50
    style Claims3 fill:#2196f3
    style Claims4 fill:#ff9800
    style Claims5 fill:#2196f3
    style Users1 fill:#4caf50
    style Users2 fill:#2196f3
    style Users3 fill:#ff9800
    style Users4 fill:#f44336
```

### 5. Database Schema (ERD)
**Purpose:** Complete database structure with relationships and constraints

```mermaid
erDiagram
    User ||--o| Provider : "works_for"
    User ||--o| Payer : "works_for"
    Provider ||--o{ Claim : "submits"
    Payer ||--o{ Claim : "adjudicates"
    Claim ||--o{ AuditLog : "has_history"
    User ||--o{ AuditLog : "performs_action"

    User {
        uuid id PK
        string email UK
        string password_hash
        enum role
        uuid provider_id FK
        uuid payer_id FK
        string phone_number "Nullable"
        boolean must_change_password
        timestamp created_at
        timestamp updated_at
    }

    Provider {
        uuid id PK
        string name
        string npi UK
        string email
        string phone
        text address
        timestamp created_at
    }

    Payer {
        uuid id PK
        string name UK
        string email
        string phone
        text address
        timestamp created_at
    }

    Claim {
        uuid id PK
        uuid provider_id FK
        string patient_name
        date patient_dob
        string member_id
        json cpt_codes "Array of CPT codes"
        json icd10_codes "Array of ICD-10 codes"
        date service_date
        decimal billed_amount
        enum status
        decimal approved_amount "Nullable"
        text denial_reason "Nullable"
        text payer_notes "Nullable"
        enum priority "HIGH, MEDIUM, LOW"
        timestamp adjudication_date "Nullable"
        timestamp created_at
        timestamp updated_at
    }

    AuditLog {
        uuid id PK
        uuid claim_id FK
        uuid user_id FK
        string action
        json previous_state
        json new_state
        timestamp timestamp
    }
```

### 6. State Machine - Claim Status Transitions
**Purpose:** Valid state transitions and business rules

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Provider submits claim

    SUBMITTED --> UNDER_REVIEW: Payer starts review
    SUBMITTED --> WITHDRAWN: Provider cancels

    UNDER_REVIEW --> APPROVED: Validation passed
    UNDER_REVIEW --> DENIED: Validation failed
    UNDER_REVIEW --> PENDING_INFO: Need clarification

    PENDING_INFO --> UNDER_REVIEW: Provider provides info
    PENDING_INFO --> WITHDRAWN: Provider cancels

    APPROVED --> PAID: Payment processed
    APPROVED --> UNDER_REVIEW: Reopen for audit

    DENIED --> [*]: Final state
    WITHDRAWN --> [*]: Final state
    PAID --> [*]: Final state

    note right of SUBMITTED
        Initial state
        Provider can view/edit
    end note

    note right of UNDER_REVIEW
        Payer reviewing
        Read-only for Provider
    end note

    note right of APPROVED
        approvedAmount must be set
        approvedAmount ≤ billedAmount
    end note

    note right of DENIED
        denialReason required
        Uses standard denial codes
    end note
```

### 7. Component Dependency Graph
**Purpose:** Shows how frontend and backend modules depend on each other

```mermaid
graph TD
    subgraph "Frontend Components"
        Pages[Pages] --> Components[UI Components]
        Pages --> Contexts[React Contexts]
        Pages --> APIClient[API Client]
        Components --> Contexts
        APIClient --> Services[Frontend Services]
    end

    subgraph "Backend Modules"
        Routes[API Routes] --> Middleware[Middleware]
        Routes --> Controllers[Controllers]
        Controllers --> BizServices[Business Services]
        BizServices --> Prisma[Prisma Client]
        Middleware --> Utils[Utilities]
        BizServices --> Utils
    end

    APIClient -->|HTTP| Routes

    style Pages fill:#61dafb
    style Components fill:#61dafb
    style Routes fill:#68a063
    style Controllers fill:#68a063
    style BizServices fill:#68a063
    style Prisma fill:#2d3748
```

---

## 🔧 Diagram Maintenance Guide

### Auto-Update Triggers
This document should be updated when:

| Change Type | Affected Diagrams | Update Required |
|-------------|-------------------|-----------------|
| New API endpoint added | API Endpoint Map, Sequence Diagrams | High Priority |
| Database schema change | ERD, Class Diagram | Critical |
| New user role added | User Roles, Security Architecture | High Priority |
| Status enum modified | State Machine, Class Diagram | Critical |
| New service/component | Component Architecture, Dependency Graph | Medium Priority |
| UI workflow change | User Journey, High-Level Workflow | Medium Priority |

### Manual Update Checklist
Before committing code changes, verify:
- [ ] New entities added to Class Diagram
- [ ] New API endpoints added to API Endpoint Map
- [ ] Database migrations reflected in ERD
- [ ] New business rules added to State Machine
- [ ] Sequence diagrams updated for modified flows

### Automated Monitoring
A git pre-commit hook monitors these files:
- `backend/prisma/schema.prisma` → Triggers ERD update reminder
- `backend/src/routes/*.ts` → Triggers API map update reminder
- `frontend/src/pages/*.tsx` → Triggers workflow update reminder

### How to Update Diagrams
1. **Mermaid Syntax:** All diagrams use [Mermaid](https://mermaid.js.org/) syntax
2. **Live Editor:** Test changes at https://mermaid.live/
3. **Style Guide:** Maintain consistent colors per audience
4. **Version Control:** Commit diagram updates with related code changes

### Diagram Style Guide
- **Business Stakeholders:** Use emojis, simple shapes, minimal technical terms
- **System Architects:** Use standard UML notation, focus on boundaries
- **Developers:** Include technical details, type annotations, constraints

---

## 📊 Diagram Rendering

### Supported Platforms
✅ GitHub (native Mermaid support)
✅ GitLab (native Mermaid support)
✅ VS Code (with Mermaid extension)
✅ Confluence (with Mermaid plugin)
✅ Notion (paste as code block with `mermaid` language)

### Troubleshooting
- **Diagram not rendering?** Check Mermaid syntax at https://mermaid.live/
- **Complex diagram too small?** Add `%%{init: {'theme':'base', 'themeVariables': {'fontSize':'16px'}}}%%` at the top
- **Need to export?** Use Mermaid CLI: `mmdc -i diagram.mmd -o diagram.png`

---

**Document Owner:** System Architecture Team
**Review Frequency:** After every major feature release
**Next Review:** [Date of next sprint planning]
**Questions?** Open an issue or contact the dev team
