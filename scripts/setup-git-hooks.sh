#!/bin/bash
#
# Setup script for Git Hooks
#
# This script configures Git to use custom hooks from .githooks directory
# Run this once after cloning the repository or when hooks are updated.
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}🔧 Setting up Git Hooks for UML Diagram Maintenance${NC}"
echo "================================================================"
echo ""

# Get the repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}⚠️  Not a git repository. Initializing...${NC}"
  git init
fi

# Configure git to use .githooks directory
echo -e "${CYAN}Setting git hooks path...${NC}"
git config core.hooksPath .githooks

# Make hooks executable
echo -e "${CYAN}Making hooks executable...${NC}"
chmod +x .githooks/*

# Verify setup
if [ "$(git config core.hooksPath)" = ".githooks" ]; then
  echo ""
  echo -e "${GREEN}✅ Git hooks configured successfully!${NC}"
  echo ""
  echo -e "Installed hooks:"
  echo -e "  • ${BOLD}pre-commit${NC} - Reminds you to update UML diagrams when critical files change"
  echo ""
  echo -e "${CYAN}How it works:${NC}"
  echo "  1. When you commit changes to Prisma schema or API routes"
  echo "  2. The hook will remind you to update UML diagrams"
  echo "  3. You can run 'node scripts/update-uml-diagrams.js' to see what needs updating"
  echo "  4. Update diagrams and include them in your commit"
  echo ""
  echo -e "${CYAN}To bypass hook (not recommended):${NC}"
  echo "  git commit --no-verify"
  echo ""
  echo -e "${GREEN}Setup complete! 🎉${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️  Failed to configure git hooks. Please run manually:${NC}"
  echo "  git config core.hooksPath .githooks"
fi
