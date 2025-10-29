/**
 * Test Helper Utilities
 * Provides common testing utilities for unit and integration tests
 */

/**
 * Mock Prisma client for unit tests
 */
const mockPrismaClient = () => {
  return {
    claim: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    auditLog: {
      create: jest.fn(),
      createMany: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    provider: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(mockPrismaClient()))
  };
};

/**
 * Sample claim data for testing
 */
const sampleClaimData = {
  urgent: {
    patient: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1965-03-15',
      memberId: 'MEM123456789'
    },
    service: {
      cptCode: '99285', // Emergency department visit
      icd10Code: 'I21.9', // Acute myocardial infarction
      serviceDate: '2025-10-29',
      billedAmount: 8500.00
    }
  },
  standard: {
    patient: {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1980-06-20',
      memberId: 'MEM987654321'
    },
    service: {
      cptCode: '70450', // CT scan
      icd10Code: 'R51', // Headache
      serviceDate: '2025-10-29',
      billedAmount: 850.00
    }
  },
  routine: {
    patient: {
      firstName: 'Bob',
      lastName: 'Johnson',
      dateOfBirth: '1975-09-10',
      memberId: 'MEM555666777'
    },
    service: {
      cptCode: '99213', // Office visit
      icd10Code: 'Z00.00', // General examination
      serviceDate: '2025-10-29',
      billedAmount: 150.00
    }
  }
};

/**
 * Mock AI categorization responses
 */
const mockAIResponses = {
  urgent: {
    priority: 'URGENT',
    confidence: 0.95,
    reasoning: 'Emergency procedure with high cost and critical diagnosis'
  },
  standard: {
    priority: 'STANDARD',
    confidence: 0.85,
    reasoning: 'Diagnostic imaging for non-urgent condition with moderate cost'
  },
  routine: {
    priority: 'ROUTINE',
    confidence: 0.91,
    reasoning: 'Basic office visit for minor condition with low cost'
  },
  fallback: {
    priority: 'STANDARD',
    confidence: 0.0,
    reasoning: 'AI service unavailable, defaulting to standard priority'
  }
};

/**
 * Wait for async operations
 */
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate unique claim number
 */
const generateClaimNumber = () => {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CLM-${date}-${random}`;
};

module.exports = {
  mockPrismaClient,
  sampleClaimData,
  mockAIResponses,
  waitFor,
  generateClaimNumber
};
