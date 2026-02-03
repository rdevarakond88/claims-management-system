# UML Diagram System - Quick Start Card

> **⏱️ 5-minute setup to get automatic diagram updates**

---

## 🚀 One-Time Setup

```bash
# 1. Enable automatic reminders
./scripts/setup-git-hooks.sh

# 2. Test it works
node scripts/update-uml-diagrams.js --check

# ✅ Done! You're all set.
```

---

## 📖 Three Files You Need to Know

1. **[SYSTEM_UML_DIAGRAMS.md](./SYSTEM_UML_DIAGRAMS.md)** ⭐
   - The main diagram file
   - Contains all UML diagrams organized by audience
   - **This is what you edit when updating diagrams**

2. **[UML_MAINTENANCE_GUIDE.md](./UML_MAINTENANCE_GUIDE.md)** 📚
   - Complete documentation
   - Step-by-step update process
   - Troubleshooting guide

3. **[.uml-config.json](../.uml-config.json)** ⚙️
   - Configuration file
   - Defines what changes trigger what updates
   - Customize if needed

---

## 🔄 Daily Workflow

### When You Change Code

```bash
# 1. Make your code changes
vim backend/prisma/schema.prisma

# 2. Try to commit
git add .
git commit -m "Add new field"

# 3. Hook reminds you to update diagrams (if needed)
# Choose option [c] to see what needs updating

# 4. Update diagrams
vim docs/SYSTEM_UML_DIAGRAMS.md

# 5. Commit together
git add docs/SYSTEM_UML_DIAGRAMS.md
git commit -m "Add new field + update diagrams"
```

---

## 🎯 Which Diagram to Update?

| You Changed... | Update These Diagrams |
|----------------|----------------------|
| **Prisma schema** | ERD, Class Diagram, State Machine |
| **API routes** | API Endpoint Map, Sequence Diagrams |
| **Controllers** | Sequence Diagrams, Component Architecture |
| **UI pages** | User Journey, Workflow diagrams |
| **Auth logic** | Security Architecture, User Roles |
| **Infrastructure** | Deployment Architecture |

---

## 🛠️ Useful Commands

```bash
# Check if diagrams are outdated
node scripts/update-uml-diagrams.js --check

# Interactive analysis with suggestions
node scripts/update-uml-diagrams.js

# Edit main diagram file
vim docs/SYSTEM_UML_DIAGRAMS.md

# Preview diagrams (in VS Code)
code docs/SYSTEM_UML_DIAGRAMS.md
# Then press: Ctrl+K V

# Emergency bypass (not recommended)
git commit --no-verify -m "Message"
```

---

## 📊 Diagram Audiences

### For Business Stakeholders
- High-level workflows
- User journeys
- Business processes
- Uses emojis and simple shapes

### For System Architects
- System architecture
- Data flow diagrams
- Deployment architecture
- Security architecture

### For Developers
- Class diagrams
- Sequence diagrams
- Database schema (ERD)
- API endpoint maps
- State machines

---

## 🎨 Editing Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax:

```markdown
### Example: Simple Flowchart

\```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do This]
    B -->|No| D[Do That]
    C --> E[End]
    D --> E
\```
```

**Preview your changes:**
- Live editor: https://mermaid.live/
- VS Code: Install "Markdown Preview Mermaid Support"
- GitHub: Renders automatically in .md files

---

## ⚠️ Important Rules

1. ✅ **DO** update diagrams in the same commit as code changes
2. ✅ **DO** use the analysis script to check what needs updating
3. ✅ **DO** preview your diagram changes before committing
4. ❌ **DON'T** skip diagram updates for "small" changes
5. ❌ **DON'T** use `--no-verify` habitually
6. ❌ **DON'T** create separate diagram files (one source of truth!)

---

## 🆘 Common Issues

**Hook not running?**
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

**Diagram not rendering?**
- Check syntax at https://mermaid.live/
- Install VS Code Mermaid extension
- Wait and refresh on GitHub

**Script fails?**
```bash
node --version  # Need v14+
chmod +x scripts/update-uml-diagrams.js
```

---

## 📚 Need More Help?

- **Full guide:** [UML_MAINTENANCE_GUIDE.md](./UML_MAINTENANCE_GUIDE.md)
- **Mermaid docs:** https://mermaid.js.org/
- **Mermaid live:** https://mermaid.live/

---

## 🎓 Learning Resources

### Mermaid Diagram Types

- **Flowchart:** `graph TD` - Process flows, workflows
- **Sequence:** `sequenceDiagram` - API interactions, request flows
- **Class:** `classDiagram` - Database models, entities
- **State:** `stateDiagram-v2` - Status transitions, state machines
- **ER Diagram:** `erDiagram` - Database relationships
- **Journey:** `journey` - User experiences, workflows

### Quick Mermaid Syntax

```mermaid
# Arrows
-->   (solid)
-.->  (dotted)
==>   (thick)

# Shapes
A[Rectangle]
B(Rounded)
C([Stadium])
D[[Subroutine]]
E[(Database)]
F((Circle))
G>Flag]
H{Diamond}

# Colors
style A fill:#ff9900
style B stroke:#333,stroke-width:4px
```

---

**🎉 You're ready to go! Start editing diagrams with confidence.**

For detailed instructions, see [UML_MAINTENANCE_GUIDE.md](./UML_MAINTENANCE_GUIDE.md)
