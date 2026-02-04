# Automation Status - Claims Management System

> **Last Updated:** 2026-02-03
>
> This document clarifies what is automatically maintained vs what requires manual updates in this repository.

---

## 🤖 What IS Automated

### 1. ✅ UML Diagram Maintenance (`docs/SYSTEM_UML_DIAGRAMS.md`)

**How it works:**
- Pre-commit git hook detects when critical files change
- Hook reminds you which specific diagrams to update
- Hook validates diagrams were updated in the same commit
- Won't let commit proceed without diagram updates

**Triggers:**
| File Changed | Diagrams That Need Updating |
|-------------|----------------------------|
| `backend/prisma/schema.prisma` | ERD, Class Diagram, Data Flow |
| `backend/src/routes/**` | API Endpoint Map, Sequence Diagrams |
| `backend/src/controllers/**` | Sequence Diagrams, Component Diagram |
| `backend/src/models/**` | Class Diagram, ERD |

**What's automatic:**
- ✅ Detection of changes
- ✅ Reminders to update diagrams
- ✅ Validation that diagrams were updated

**What's manual:**
- ❌ Actual diagram content updates (you edit the .md file)

**Why not fully automatic?**
Diagrams require human judgment about:
- Business context and relationships
- Design decisions and architecture
- Which details to show/hide for each audience
- Maintaining narrative flow and clarity

---

### 2. ✅ Email Notifications

**How it works:**
- Post-commit git hook detects CHANGELOG.md changes
- Hook extracts version number
- Prompts you to send notifications (or skip)
- Generates 3 audience-specific HTML emails
- Sends via Gmail SMTP automatically

**Triggers:**
- Any commit that modifies `CHANGELOG.md`

**What's automatic:**
- ✅ Detection of CHANGELOG changes
- ✅ Prompt to send notifications
- ✅ Email generation from CHANGELOG content
- ✅ SMTP sending to configured recipients
- ✅ HTML backup file creation

**What's manual:**
- ❌ Writing CHANGELOG content
- ❌ Choosing when to send (y/n prompt)

**Why not fully automatic?**
You need control over:
- When notifications are sent (not every commit)
- CHANGELOG content quality and messaging
- Testing before sending to stakeholders

---

## ❌ What is NOT Automated (Manual Updates Required)

### 1. ❌ PRD.md (Product Requirements Document)

**Current status:** No automation

**Why?**
- Requires business context and stakeholder input
- Needs product strategy and roadmap thinking
- Should reflect user research and market analysis
- Changes are strategic, not just code-driven

**Example:** When you added `phoneNumber` field:
- ✅ Code change: Added field to Prisma schema
- ✅ Diagrams: Updated Class Diagram + ERD (automated reminder)
- ❌ PRD.md: Does NOT auto-update or remind

**Should it be automated?**
Probably not. PRD changes should be intentional business decisions, not automatic reflections of code changes. The field might be a technical implementation of a larger feature that requires business documentation.

**Workaround:**
Add to your own workflow:
```bash
# When making feature changes, check these manually:
# 1. Update code
# 2. Update diagrams (automated reminder)
# 3. Update CHANGELOG.md (triggers emails)
# 4. Check if PRD.md needs updating (manual decision)
```

---

### 2. ❌ API_CONTRACTS.md

**Current status:** No automation

**Why?**
- Requires API design decisions (versioning, breaking changes)
- Needs documentation of request/response formats
- Should include error codes and edge cases
- Changes may be planned vs implemented

**Example:** When you added `phoneNumber` field:
- API might return phoneNumber in GET /api/users/:id
- API might accept phoneNumber in POST /api/admin/users
- But exact contract requires design decisions (required? validated?)

**Could it be automated?**
Partially. Could create reminders when routes change, but actual contract documentation requires design thinking.

**Potential automation:**
```json
// Could add to .uml-config.json
{
  "updateTriggers": {
    "apiContracts": {
      "watchFiles": ["backend/src/routes/**/*.ts"],
      "reminderMessage": "⚠️  API routes changed. Update API_CONTRACTS.md",
      "requireUpdate": false  // Warning only, not blocking
    }
  }
}
```

---

### 3. ❌ DATA_MODEL.md

**Current status:** No automation

**Why?**
- Requires explanation of data relationships and business rules
- Needs context about why data is modeled this way
- Should include data governance and ownership
- More narrative than the technical ERD diagram

**Example:** When you added `phoneNumber` field:
- ERD shows the field exists (automated reminder)
- DATA_MODEL.md should explain:
  - Why phoneNumber is optional
  - How it's used in business processes
  - Data privacy considerations
  - Validation rules

**Relationship with automated UML diagrams:**
- ✅ ERD in SYSTEM_UML_DIAGRAMS.md shows structure (automated reminder)
- ❌ DATA_MODEL.md explains meaning and context (manual)

---

### 4. ❌ README.md

**Current status:** Manually maintained

**Why?**
- Reflects repository purpose and getting started
- Requires human-written explanations
- Should be tailored for the primary audience

**When to update:**
- New features that change how users interact with the system
- New setup steps or dependencies
- Major architectural changes

**Note:** We manually updated README.md this session to highlight automation features.

---

### 5. ❌ Other Documentation Files

Files without automation:
- `CONTRIBUTING.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TESTING.md`
- Architecture decision records (ADRs)
- Meeting notes
- Project roadmap

**Why?**
These are strategic, process-oriented, or narrative documents that require human thought and context.

---

## 🎯 Automation Philosophy

### Semi-Automated Approach

This repository uses **"Detection + Reminders + Validation"** instead of **"Full Auto-Generation"**:

| Approach | Pros | Cons |
|----------|------|------|
| **Full Auto-Generation** | Always up-to-date, zero effort | Loses context, poor quality, no narrative |
| **Manual Only** | High quality, full control | Easily forgotten, becomes stale |
| **Semi-Automated (Current)** | Quality + freshness, human oversight | Requires some effort |

### What Gets Automated

✅ **Automate detection and reminders for:**
- Technical artifacts that mirror code structure (UML diagrams)
- Repetitive tasks (email generation)
- Validation and consistency checks

❌ **Keep manual for:**
- Strategic documents (PRD, roadmap)
- Narrative explanations (architecture decisions)
- Business context (requirements, user research)

---

## 📋 Extending Automation

### How to Add Reminders for Other Files

If you want reminders for PRD.md, API_CONTRACTS.md, etc.:

1. **Edit `.uml-config.json`:**
```json
{
  "updateTriggers": {
    "prd": {
      "watchFiles": [
        "backend/prisma/schema.prisma",
        "backend/src/routes/**"
      ],
      "affectedDocuments": [
        {
          "file": "PRD.md",
          "message": "⚠️  Schema/routes changed. Consider updating PRD.md",
          "priority": "medium"
        }
      ]
    }
  }
}
```

2. **Edit `.githooks/pre-commit`:**
```bash
# Add PRD check
if git diff --cached --name-only | grep -q "backend/prisma/schema.prisma"; then
  echo "⚠️  Schema changed. Consider updating PRD.md"
  # Non-blocking warning
fi
```

3. **Choose blocking vs non-blocking:**
- **Blocking** (current for UML diagrams): Commit fails if not updated
- **Non-blocking** (better for PRD): Warning only, commit proceeds

---

## 🔄 Typical Workflow

### When You Make Code Changes

```bash
# 1. Make code changes
vim backend/prisma/schema.prisma

# 2. Stage changes
git add backend/prisma/schema.prisma

# 3. Try to commit
git commit -m "Add phoneNumber field"

# 4. Pre-commit hook triggers
# ⚠️  Schema changed! Update these diagrams:
#     - Class Diagram
#     - ERD

# 5. Update diagrams (manual editing)
vim docs/SYSTEM_UML_DIAGRAMS.md

# 6. Stage diagram updates
git add docs/SYSTEM_UML_DIAGRAMS.md

# 7. Commit again
git commit -m "Add phoneNumber field + update diagrams"
# ✓ Diagrams updated. Commit proceeding.

# 8. Update CHANGELOG (manual)
vim CHANGELOG.md
git add CHANGELOG.md
git commit -m "Release v1.2.0"

# 9. Post-commit hook triggers
# 📧 Send release notifications? [y/d/l/n]

# 10. Choose to send
# y
# ✅ Emails sent to 3 audiences

# 11. Manual check (your own workflow)
# - Does PRD.md need updating? (your decision)
# - Does API_CONTRACTS.md need updating? (your decision)
```

---

## 📊 Automation Coverage Summary

| Document | Automated Reminders | Auto-Generation | Manual Updates |
|----------|-------------------|-----------------|----------------|
| SYSTEM_UML_DIAGRAMS.md | ✅ Yes (blocking) | ❌ No | ✅ Required |
| CHANGELOG.md | ❌ No | ❌ No | ✅ Required |
| Email Notifications | ✅ Yes (prompt) | ✅ Yes | ❌ Automatic |
| PRD.md | ❌ No | ❌ No | ✅ Manual only |
| API_CONTRACTS.md | ❌ No | ❌ No | ✅ Manual only |
| DATA_MODEL.md | ❌ No | ❌ No | ✅ Manual only |
| README.md | ❌ No | ❌ No | ✅ Manual only |

---

## 🚀 Quick Reference

### To check automation status:
```bash
# Check git hooks enabled
git config core.hooksPath
# Should output: .githooks

# Check UML diagram status
node scripts/update-uml-diagrams.js --check

# Test email system
node scripts/send-release-notifications.js --dry-run
```

### To extend automation:
1. Edit `.uml-config.json` to add new triggers
2. Edit `.githooks/pre-commit` for new reminders
3. Decide: blocking (fails commit) or warning (proceeds)

### To disable automation:
```bash
# Temporarily disable hooks for one commit
git commit --no-verify -m "message"

# Permanently disable hooks
git config core.hooksPath ""
```

---

## ❓ FAQ

### Q: Should I manually update PRD.md when I add a field like phoneNumber?

**A:** It depends on the context:
- **Yes, if** the field represents a new user-facing feature that stakeholders need to know about
- **No, if** the field is an internal implementation detail

In the phoneNumber case: Probably yes, because it's a user-facing feature that affects the product.

### Q: Why doesn't the system automatically update all .md files?

**A:** Quality over automation. Auto-generated documentation:
- Lacks business context
- Misses the "why" behind changes
- Can't explain design decisions
- Loses narrative flow

Human-written docs with automated reminders achieve better results.

### Q: Can I make it automatically update API_CONTRACTS.md?

**A:** Technically possible (parse routes, generate OpenAPI spec), but:
- Won't capture error codes, edge cases, design rationale
- Better to add reminders instead of auto-generation

### Q: What if I forget to update diagrams?

**A:** You can't commit. The pre-commit hook is blocking - it requires diagram updates before allowing the commit.

### Q: What if I forget to update PRD.md?

**A:** Currently nothing happens. You can add a non-blocking reminder to the pre-commit hook if you want warnings.

---

## 📝 Recommendations

### For Maximum Documentation Quality

1. **Keep current automation** (UML diagrams + emails)
2. **Add non-blocking warnings** for PRD.md, API_CONTRACTS.md
3. **Maintain manual updates** for strategic documents
4. **Use CHANGELOG.md** as the source of truth for releases
5. **Review docs quarterly** to catch anything missed

### For Your Workflow

Add this checklist to your personal workflow:

```markdown
## Code Change Checklist

When making significant changes:

- [ ] Update code
- [ ] Update UML diagrams (automated reminder)
- [ ] Update CHANGELOG.md if releasing
- [ ] Consider: Does PRD.md need updating?
- [ ] Consider: Does API_CONTRACTS.md need updating?
- [ ] Consider: Does README.md need updating?
- [ ] Run tests
- [ ] Commit and push
```

---

**Questions or want to extend automation?** Edit `.uml-config.json` and `.githooks/pre-commit`.

**See also:**
- `SESSION_SUMMARY.md` - Complete session context
- `docs/UML_MAINTENANCE_GUIDE.md` - UML system guide
- `docs/EMAIL_NOTIFICATIONS_GUIDE.md` - Email system guide
