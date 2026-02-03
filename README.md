# Claims Management System (CMS)

> A lightweight, learning-focused web application simulating real-world healthcare claims workflows between Providers, Payers, and CMS.

---

## 🎯 Project Overview

This project is a **Product Management learning initiative** designed to:
- Demonstrate end-to-end product thinking (from PRD to deployment)
- Simulate enterprise-grade healthcare claims processing
- Showcase AI-assisted product development workflows

**Built by:** [rdevarakond88](https://github.com/rdevarakond88)
**Domain:** Healthcare IT (Payer/Provider Claims Management)
**Tech Stack:** Node.js, React, PostgreSQL, Redis

---

## 🤖 Smart Automation Features

### 📧 Intelligent Release Notifications
This repository features an **automated email notification system** that sends tailored updates to different stakeholders:

- **🎯 Business Stakeholders** — High-level summaries, business impact, user experience changes
- **🏗️ System Architects** — Architecture changes, infrastructure updates, security & performance
- **👨‍💻 Developers** — Technical details, API changes, database schema, migration guides

**How it works:**
- Update `CHANGELOG.md` with version-specific changes
- Commit your changes
- System automatically detects and prompts to send audience-specific emails
- Each persona receives customized, beautifully formatted HTML emails

➡️ **[Email Notifications Guide](./docs/EMAIL_NOTIFICATIONS_GUIDE.md)**

### 📊 Auto-Maintained UML Diagrams
Comprehensive **18+ UML diagrams** that stay in sync with your codebase:

- **Multi-audience design** — Separate views for business, architects, and developers
- **Automatic staleness detection** — Git hooks remind you when diagrams need updating
- **Smart change tracking** — Monitors Prisma schema, API routes, and critical files
- **GitHub-friendly** — Renders beautifully with Mermaid syntax

➡️ **[View System Diagrams](./docs/SYSTEM_UML_DIAGRAMS.md)** | **[UML Maintenance Guide](./docs/UML_MAINTENANCE_GUIDE.md)**

**These automation features ensure your documentation stays current and stakeholders stay informed — automatically.**

---

## 🏥 What This System Does

The Claims Management System models the interaction between:

1. **Providers** (hospitals, clinics) — Submit claims for patient services
2. **Payers** (insurance companies like Humana, UnitedHealthcare) — Process and adjudicate claims
3. **CMS Proxy** (Centers for Medicare & Medicaid Services) — Receive forwarded claims for reimbursement

### Core Workflows (MVP Scope)
- ✅ User Authentication & Admin Provisioning
- ✅ Claims Submission
- ✅ Claims Adjudication
- ✅ Claims Status Tracking
- 🔄 Eligibility Verification
- 🔄 CMS Forwarding

### Current Status: 70% Production-Ready
See [Production Readiness Roadmap](./docs/PRODUCTION_READINESS.md) for detailed gap analysis and implementation plan.

---

## 📁 Repository Structure
```
/claims-management-system
│
├── /docs                    # Product requirements and documentation
│   ├── SYSTEM_UML_DIAGRAMS.md            # ⭐ 18+ auto-maintained UML diagrams
│   ├── EMAIL_NOTIFICATIONS_GUIDE.md       # ⭐ Automated email system docs
│   └── ... (other docs)
├── /architecture            # System design, data models, API specs
├── /context-for-ai          # Context files for AI-assisted development
├── /deployment              # Docker, CI/CD, DevOps configurations
├── /email-templates         # ⭐ HTML email templates (Business, Dev, Architect)
├── /scripts                 # ⭐ Automation scripts
│   ├── send-release-notifications.js     # Email notification system
│   └── update-uml-diagrams.js            # Diagram maintenance tool
├── /.githooks               # ⭐ Smart git hooks for automation
├── /frontend                # React frontend application
├── /backend                 # Express.js API backend
├── CHANGELOG.md             # ⭐ Multi-audience release notes
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or Python (v3.10+) — TBD based on tech stack decision
- Docker Desktop (for containerization)
- Git + GitHub account

### Setup Instructions
```bash
# Clone the repository
git clone https://github.com/rdevarakond88/claims-management-system.git
cd claims-management-system

# (Further setup instructions will be added as the project develops)
```

---

## 📚 Documentation

All product and technical documentation lives in the `/docs` and `/architecture` folders:

### Smart Documentation & Automation
- **[System UML Diagrams](./docs/SYSTEM_UML_DIAGRAMS.md)** ⭐ — 18+ multi-audience diagrams with auto-update system
- **[UML Maintenance Guide](./docs/UML_MAINTENANCE_GUIDE.md)** — Complete guide to diagram automation
- **[Email Notifications Guide](./docs/EMAIL_NOTIFICATIONS_GUIDE.md)** ⭐ — Automated release notifications setup
- **[CHANGELOG](./CHANGELOG.md)** — Multi-audience release notes

### Product Documentation
- **[PRD (Product Requirements Document)](./docs/PRD.md)** — Full product specification
- **[Production Readiness Roadmap](./docs/PRODUCTION_READINESS.md)** — Implementation gaps and priority roadmap
- **[Troubleshooting Log](./docs/TROUBLESHOOTING_LOG.md)** — Real issues found and resolved during development
- **[User Stories](./docs/USER_STORIES.md)** — User scenarios and acceptance criteria

### Technical Documentation
- **[System Design](./architecture/SYSTEM_DESIGN.md)** — Architecture overview
- **[Data Model](./architecture/DATA_MODEL.md)** — Database schema
- **[API Contracts](./architecture/API_CONTRACTS.md)** — Endpoint specifications
- **[Admin User Provisioning Guide](./docs/ADMIN_USER_PROVISIONING.md)** — Implementation guide for user management

---

## 🧠 AI-Assisted Development

This project uses **Claude Code** and **GitHub MCP integration** for:
- Context-aware code generation
- Consistent implementation of requirements
- Automated documentation updates
- **Smart automation systems** (UML diagrams, email notifications)

**Intelligent Features Built with AI:**
- 📧 Multi-audience email notification system with persona-specific content
- 📊 Auto-maintained UML diagrams with staleness detection
- 🔔 Git hooks for automatic documentation reminders
- 📝 CHANGELOG-driven release management

Context files for AI assistants are stored in `/context-for-ai/`.

---

## 🛠️ Development Phases

### Phase 1: Product Requirements ✅ (Completed)
- ✅ Define PRD with user personas, workflows, and acceptance criteria
- ✅ Establish data models and API contracts
- ✅ Create comprehensive documentation

### Phase 2: MVP Development ✅ (Completed)
- ✅ Build core submission and adjudication flows
- ✅ Implement UI for providers, payers, and admin
- ✅ Set up PostgreSQL database with Prisma ORM
- ✅ Build backend API with Express.js
- ✅ Implement session-based authentication
- ✅ Add admin user provisioning with temporary passwords

### Phase 3: Production Readiness 🔄 (In Progress - 70% Complete)
**Next Steps:**
1. Add logging & monitoring (Winston, Sentry)
2. Implement rate limiting & security hardening
3. Complete input sanitization & validation
4. Environment configuration & deployment setup

See [Production Readiness Roadmap](./docs/PRODUCTION_READINESS.md) for full details.

### Phase 4: DevOps & Deployment 📋 (Planned)
- Containerize with Docker
- Set up CI/CD pipeline (GitHub Actions)
- Implement monitoring (Prometheus, Grafana)
- Deploy to cloud (AWS/Heroku/Vercel)

---

## 📝 License

This project is for educational and portfolio purposes.

---

## 🤝 Contributing

This is a personal learning project, but feedback and suggestions are welcome!  
Feel free to open an issue or reach out via GitHub.

---

**Last Updated:** October 2025
