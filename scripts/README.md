# Scripts Directory

This directory contains automation scripts for the Claims Management System.

## 📜 Available Scripts

### 1. `update-uml-diagrams.js`
**Purpose:** Analyzes codebase and suggests UML diagram updates

```bash
# Interactive mode (shows checklist and suggestions)
node scripts/update-uml-diagrams.js

# Check mode (CI/CD - exits with error if outdated)
node scripts/update-uml-diagrams.js --check

# Update mode (shows what needs updating)
node scripts/update-uml-diagrams.js --update
```

**What it does:**
- Scans Prisma schema for database models
- Scans routes for API endpoints
- Compares file modification times
- Generates update checklist
- Provides specific diagram update suggestions

### 2. `setup-git-hooks.sh`
**Purpose:** One-time setup to enable automatic diagram update reminders

```bash
# Run once after cloning the repo
./scripts/setup-git-hooks.sh
```

**What it does:**
- Configures Git to use custom hooks from `.githooks/`
- Makes hooks executable
- Verifies installation
- Enables pre-commit diagram reminders

## 🎯 Quick Start

### First Time Setup

```bash
# 1. Enable git hooks
./scripts/setup-git-hooks.sh

# 2. Verify it works
node scripts/update-uml-diagrams.js --check

# 3. Done! The system will now remind you to update diagrams
```

### Daily Usage

```bash
# When you make code changes, run this to see what diagrams need updating
node scripts/update-uml-diagrams.js

# The pre-commit hook will automatically remind you if you forget
git commit -m "Your changes"
```

## 📚 Related Documentation

- **Main Diagram File:** [docs/SYSTEM_UML_DIAGRAMS.md](../docs/SYSTEM_UML_DIAGRAMS.md)
- **Maintenance Guide:** [docs/UML_MAINTENANCE_GUIDE.md](../docs/UML_MAINTENANCE_GUIDE.md)
- **Configuration:** [.uml-config.json](../.uml-config.json)

## 🛠️ Adding New Scripts

When adding new scripts to this directory:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add usage documentation in this README
3. Include error handling and helpful messages
4. Follow the project's coding standards

## 💡 Tips

- Run `update-uml-diagrams.js` regularly to keep diagrams in sync
- The git hook will catch most cases, but manual checks are still good practice
- Use `--check` mode in CI/CD pipelines to enforce diagram updates

## 🐛 Troubleshooting

If scripts don't work:

```bash
# Make sure they're executable
chmod +x scripts/*.sh
chmod +x scripts/*.js

# Check Node.js version (need v14+)
node --version

# Verify git hooks are enabled
git config core.hooksPath
```

For more help, see [UML Maintenance Guide](../docs/UML_MAINTENANCE_GUIDE.md#troubleshooting).
