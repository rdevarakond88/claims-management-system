#!/usr/bin/env node
/**
 * UML Diagram Auto-Update Script
 *
 * This script analyzes the codebase and generates/updates UML diagrams
 * in the SYSTEM_UML_DIAGRAMS.md file.
 *
 * Usage:
 *   node scripts/update-uml-diagrams.js [--check|--update|--interactive]
 *
 * Modes:
 *   --check       Check if diagrams are out of sync (exit code 1 if updates needed)
 *   --update      Automatically update diagrams
 *   --interactive Ask before making changes (default)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  diagramFile: path.join(__dirname, '..', 'docs', 'SYSTEM_UML_DIAGRAMS.md'),
  prismaSchema: path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma'),
  routesDir: path.join(__dirname, '..', 'backend', 'src', 'routes'),
  frontendPagesDir: path.join(__dirname, '..', 'frontend', 'src', 'pages'),
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Check if files exist
function checkFiles() {
  const missingFiles = [];

  if (!fs.existsSync(CONFIG.diagramFile)) {
    missingFiles.push('SYSTEM_UML_DIAGRAMS.md');
  }
  if (!fs.existsSync(CONFIG.prismaSchema)) {
    missingFiles.push('Prisma schema');
  }
  if (!fs.existsSync(CONFIG.routesDir)) {
    missingFiles.push('Routes directory');
  }

  if (missingFiles.length > 0) {
    error(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }

  return true;
}

// Parse Prisma schema to extract models
function parsePrismaSchema() {
  try {
    const schema = fs.readFileSync(CONFIG.prismaSchema, 'utf-8');
    const models = [];
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;

    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1];
      const fields = match[2].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
      models.push({ name: modelName, fields });
    }

    const enums = [];
    while ((match = enumRegex.exec(schema)) !== null) {
      const enumName = match[1];
      const values = match[2].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
      enums.push({ name: enumName, values });
    }

    return { models, enums };
  } catch (err) {
    error(`Failed to parse Prisma schema: ${err.message}`);
    return { models: [], enums: [] };
  }
}

// Scan routes directory to find API endpoints
function scanApiEndpoints() {
  try {
    const endpoints = [];
    const routeFiles = fs.readdirSync(CONFIG.routesDir).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of routeFiles) {
      const filePath = path.join(CONFIG.routesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Simple regex to find route definitions (not perfect but good enough)
      const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
      let match;

      while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        endpoints.push({ method, path, file });
      }
    }

    return endpoints;
  } catch (err) {
    error(`Failed to scan API endpoints: ${err.message}`);
    return [];
  }
}

// Analyze changes and generate report
function analyzeChanges() {
  info('Analyzing codebase for diagram updates...\n');

  const changes = {
    database: [],
    api: [],
    recommendations: [],
  };

  // Check Prisma schema
  const { models, enums } = parsePrismaSchema();
  if (models.length > 0) {
    info(`Found ${models.length} database models: ${models.map(m => m.name).join(', ')}`);
    changes.database.push(`Database has ${models.length} models`);
    changes.recommendations.push('✓ Verify ERD includes all models');
    changes.recommendations.push('✓ Check Class Diagram matches Prisma schema');
  }

  if (enums.length > 0) {
    info(`Found ${enums.length} enums: ${enums.map(e => e.name).join(', ')}`);
    changes.database.push(`Database has ${enums.length} enums`);
    changes.recommendations.push('✓ Verify State Machine reflects status enums');
  }

  // Check API endpoints
  const endpoints = scanApiEndpoints();
  if (endpoints.length > 0) {
    info(`Found ${endpoints.length} API endpoints`);
    changes.api.push(`API has ${endpoints.length} endpoints`);
    changes.recommendations.push('✓ Verify API Endpoint Map is complete');
    changes.recommendations.push('✓ Check Sequence Diagrams for new flows');

    // Group by method
    const methodCounts = endpoints.reduce((acc, ep) => {
      acc[ep.method] = (acc[ep.method] || 0) + 1;
      return acc;
    }, {});

    info(`Endpoint breakdown: ${Object.entries(methodCounts).map(([m, c]) => `${m}:${c}`).join(', ')}`);
  }

  return changes;
}

// Generate update checklist
function generateChecklist(changes) {
  console.log('\n' + '='.repeat(60));
  log('📋 DIAGRAM UPDATE CHECKLIST', 'bright');
  console.log('='.repeat(60) + '\n');

  log('Based on your codebase analysis, please verify:', 'cyan');
  console.log('');

  changes.recommendations.forEach(rec => {
    console.log(`  ${rec}`);
  });

  console.log('\n' + '-'.repeat(60));
  log('Database Schema Changes:', 'yellow');
  changes.database.forEach(change => console.log(`  • ${change}`));

  console.log('\n' + '-'.repeat(60));
  log('API Changes:', 'yellow');
  changes.api.forEach(change => console.log(`  • ${change}`));

  console.log('\n' + '='.repeat(60));
  log('📄 Diagram File Location:', 'bright');
  console.log(`  ${CONFIG.diagramFile}`);
  console.log('='.repeat(60) + '\n');
}

// Show specific suggestions for outdated diagrams
function showSpecificSuggestions() {
  console.log('\n' + '💡 SPECIFIC UPDATE SUGGESTIONS'.padEnd(60, ' '));
  console.log('='.repeat(60) + '\n');

  const { models, enums } = parsePrismaSchema();
  const endpoints = scanApiEndpoints();

  // Check for common patterns
  if (models.some(m => m.name === 'Claim')) {
    log('Class Diagram:', 'bright');
    console.log('  - Verify Claim model has all fields from Prisma schema');
    console.log('  - Check relationships: Provider → Claim, Payer → Claim\n');
  }

  if (enums.some(e => e.name === 'Status' || e.name === 'ClaimStatus')) {
    log('State Machine:', 'bright');
    console.log('  - Update claim status transitions if Status enum changed');
    console.log('  - Verify all status values are represented\n');
  }

  if (endpoints.some(ep => ep.path.includes('/claims'))) {
    log('API Endpoint Map:', 'bright');
    console.log('  - Review all /claims endpoints');
    console.log('  - Check for new CRUD operations\n');
  }

  if (endpoints.some(ep => ep.path.includes('/adjudicate'))) {
    log('Sequence Diagrams:', 'bright');
    console.log('  - Verify adjudication flow matches current implementation');
    console.log('  - Check middleware chain in sequence diagram\n');
  }
}

// Interactive prompt
async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

// Get last modified time of diagram file
function getDiagramLastModified() {
  try {
    const stats = fs.statSync(CONFIG.diagramFile);
    return stats.mtime;
  } catch (err) {
    return null;
  }
}

// Check if codebase changed after last diagram update
function checkIfOutdated() {
  const diagramMtime = getDiagramLastModified();
  if (!diagramMtime) {
    warning('Cannot determine diagram last modified time');
    return false;
  }

  const filesToCheck = [
    CONFIG.prismaSchema,
    ...fs.readdirSync(CONFIG.routesDir).map(f => path.join(CONFIG.routesDir, f)),
  ];

  for (const file of filesToCheck) {
    try {
      const stats = fs.statSync(file);
      if (stats.mtime > diagramMtime) {
        warning(`File modified after diagrams: ${path.basename(file)}`);
        return true;
      }
    } catch (err) {
      // File might not exist, skip
    }
  }

  return false;
}

// Main function
async function main() {
  const mode = process.argv[2] || '--interactive';

  log('\n🎨 UML Diagram Update Tool', 'bright');
  console.log('='.repeat(60) + '\n');

  // Check files exist
  if (!checkFiles()) {
    process.exit(1);
  }

  // Analyze codebase
  const changes = analyzeChanges();

  // Check if outdated
  const isOutdated = checkIfOutdated();

  if (mode === '--check') {
    // Check mode: exit with error if updates needed
    console.log('');
    if (isOutdated) {
      error('Diagrams appear outdated. Code files modified after last diagram update.');
      generateChecklist(changes);
      process.exit(1);
    } else {
      success('Diagrams appear up to date!');
      process.exit(0);
    }
  } else if (mode === '--update') {
    // Auto-update mode
    warning('Auto-update mode is not yet implemented.');
    warning('Please manually update diagrams using the checklist below.\n');
    generateChecklist(changes);
    showSpecificSuggestions();
  } else {
    // Interactive mode (default)
    generateChecklist(changes);

    if (isOutdated) {
      console.log('');
      warning('⏰ Diagrams may be outdated (code changed after last diagram update)');
    }

    console.log('');
    const answer = await promptUser('Would you like to see specific update suggestions? (y/n): ');

    if (answer === 'y' || answer === 'yes') {
      showSpecificSuggestions();
    }

    console.log('');
    success('Update checklist complete!');
    info(`Edit diagrams at: ${CONFIG.diagramFile}`);
    console.log('');
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    error(`Script failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parsePrismaSchema, scanApiEndpoints, analyzeChanges };
