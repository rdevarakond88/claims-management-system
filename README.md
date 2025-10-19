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
**Tech Stack:** (To be determined in architecture phase)

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
├── /architecture            # System design, data models, API specs
├── /context-for-ai          # Context files for AI-assisted development
├── /deployment              # Docker, CI/CD, DevOps configurations
├── /src                     # Source code (to be added)
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

- **[PRD (Product Requirements Document)](./docs/PRD.md)** — Full product specification
- **[Production Readiness Roadmap](./docs/PRODUCTION_READINESS.md)** — Implementation gaps and priority roadmap
- **[User Stories](./docs/USER_STORIES.md)** — User scenarios and acceptance criteria
- **[Admin User Provisioning Guide](./docs/ADMIN_USER_PROVISIONING.md)** — Implementation guide for user management
- **[System Design](./architecture/SYSTEM_DESIGN.md)** — Architecture overview
- **[Data Model](./architecture/DATA_MODEL.md)** — Database schema
- **[API Contracts](./architecture/API_CONTRACTS.md)** — Endpoint specifications

---

## 🧠 AI-Assisted Development

This project uses **Claude Code** and **GitHub MCP integration** for:
- Context-aware code generation
- Consistent implementation of requirements
- Automated documentation updates

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
