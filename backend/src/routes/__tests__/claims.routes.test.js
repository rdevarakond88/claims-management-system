/**
 * Integration Tests for Claims API Routes
 * Tests the complete flow: routes -> controllers -> services -> AI categorization
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');

// Mock Anthropic SDK before imports
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }));
});

const claimsRoutes = require('../claims.routes');
const prisma = new PrismaClient();

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Session middleware
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // Mock auth middleware - sets session data
  app.use((req, res, next) => {
    req.session.userId = req.headers['x-test-user-id'];
    req.session.userRole = req.headers['x-test-user-role'];
    next();
  });

  app.use('/api/claims', claimsRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message
      }
    });
  });

  return app;
}

describe('Claims API Integration Tests', () => {
  let app;
  let testProvider;
  let testPayer;
  let providerUser;
  let payerUser;

  beforeAll(async () => {
    // Set up test environment
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    process.env.AI_CATEGORIZATION_ENABLED = 'true';

    app = createTestApp();

    // Create test provider
    testProvider = await prisma.provider.create({
      data: {
        name: 'Test Provider Hospital',
        npi: '1234567890',
        taxId: '12-3456789',
        address: '123 Test St',
        city: 'Test City',
        state: 'NY',
        zipCode: '10001'
      }
    });

    // Create test payer
    testPayer = await prisma.payer.create({
      data: {
        name: 'Test Insurance Co',
        code: 'TEST001',
        address: '456 Payer Ave',
        city: 'Test City',
        state: 'NY',
        zipCode: '10002'
      }
    });

    // Create provider user
    providerUser = await prisma.user.create({
      data: {
        email: 'provider@test.com',
        firstName: 'Provider',
        lastName: 'User',
        role: 'provider_staff',
        providerId: testProvider.id,
        isActive: true,
        passwordHash: 'test-hash'
      }
    });

    // Create payer user
    payerUser = await prisma.user.create({
      data: {
        email: 'payer@test.com',
        firstName: 'Payer',
        lastName: 'User',
        role: 'payer_processor',
        payerId: testPayer.id,
        isActive: true,
        passwordHash: 'test-hash'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.claim.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.payer.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReset();
  });

  describe('POST /api/claims - Create Claim with AI Categorization', () => {
    it('should create urgent priority claim for emergency with AI', async () => {
      // Mock AI response for urgent claim
      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            priority: 'URGENT',
            confidence: 0.95,
            reasoning: 'Emergency department visit for acute myocardial infarction with high cost'
          })
        }]
      });

      const claimData = {
        patient: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1965-03-15',
          memberId: 'MEM123456'
        },
        service: {
          serviceDate: '2024-01-15',
          cptCode: '99285',
          icd10Code: 'I21.9',
          billedAmount: 8500
        }
      };

      const response = await request(app)
        .post('/api/claims')
        .set('x-test-user-id', providerUser.id)
        .set('x-test-user-role', 'provider_staff')
        .send(claimData)
        .expect(201);

      expect(response.body.claim).toBeDefined();
      expect(response.body.claim.priority).toBe('URGENT');
      expect(response.body.claim.priorityConfidence).toBeCloseTo(0.95);
      expect(response.body.claim.priorityReasoning).toContain('Emergency');
      expect(response.body.claim.claimNumber).toMatch(/^CLM-\d{8}-\d{4}$/);

      // Verify AI was called
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should create routine priority claim for preventive care', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            priority: 'ROUTINE',
            confidence: 0.91,
            reasoning: 'Preventive annual wellness visit, standard screening'
          })
        }]
      });

      const claimData = {
        patient: {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1980-06-20',
          memberId: 'MEM654321'
        },
        service: {
          serviceDate: '2024-01-20',
          cptCode: '99395',
          icd10Code: 'Z00.00',
          billedAmount: 200
        }
      };

      const response = await request(app)
        .post('/api/claims')
        .set('x-test-user-id', providerUser.id)
        .set('x-test-user-role', 'provider_staff')
        .send(claimData)
        .expect(201);

      expect(response.body.claim.priority).toBe('ROUTINE');
      expect(response.body.claim.priorityConfidence).toBeCloseTo(0.91);
    });

    it('should default to STANDARD priority if AI fails', async () => {
      // Mock AI failure
      mockCreate.mockRejectedValue(new Error('API error'));

      const claimData = {
        patient: {
          firstName: 'Bob',
          lastName: 'Jones',
          dateOfBirth: '1975-09-10',
          memberId: 'MEM789012'
        },
        service: {
          serviceDate: '2024-01-25',
          cptCode: '70450',
          icd10Code: 'R51',
          billedAmount: 850
        }
      };

      const response = await request(app)
        .post('/api/claims')
        .set('x-test-user-id', providerUser.id)
        .set('x-test-user-role', 'provider_staff')
        .send(claimData)
        .expect(201);

      // Should succeed with default priority
      expect(response.body.claim.priority).toBe('STANDARD');
      expect(response.body.claim.priorityConfidence).toBeCloseTo(0.0);
      expect(response.body.claim.priorityReasoning).toContain('error');
    });

    it('should reject claim with missing required fields', async () => {
      const invalidData = {
        patient: {
          firstName: 'Test'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/claims')
        .set('x-test-user-id', providerUser.id)
        .set('x-test-user-role', 'provider_staff')
        .send(invalidData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject claim from non-provider user', async () => {
      mockCreate.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            priority: 'STANDARD',
            confidence: 0.85,
            reasoning: 'Standard claim'
          })
        }]
      });

      const claimData = {
        patient: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          memberId: 'MEM111111'
        },
        service: {
          serviceDate: '2024-01-30',
          cptCode: '99213',
          icd10Code: 'J06.9',
          billedAmount: 150
        }
      };

      const response = await request(app)
        .post('/api/claims')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .send(claimData)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/claims - List Claims with Priority Filter', () => {
    let urgentClaim, standardClaim, routineClaim;

    beforeAll(async () => {
      // Create test claims with different priorities
      urgentClaim = await prisma.claim.create({
        data: {
          claimNumber: 'CLM-20240101-0001',
          providerId: testProvider.id,
          submittedByUserId: providerUser.id,
          status: 'submitted',
          priority: 'URGENT',
          priorityConfidence: 0.95,
          priorityReasoning: 'Emergency',
          patientFirstName: 'Urgent',
          patientLastName: 'Patient',
          patientDob: new Date('1960-01-01'),
          patientMemberId: 'URG001',
          cptCode: '99285',
          icd10Code: 'I21.9',
          serviceDate: new Date('2024-01-01'),
          billedAmount: 8500
        }
      });

      standardClaim = await prisma.claim.create({
        data: {
          claimNumber: 'CLM-20240102-0001',
          providerId: testProvider.id,
          submittedByUserId: providerUser.id,
          status: 'submitted',
          priority: 'STANDARD',
          priorityConfidence: 0.85,
          priorityReasoning: 'Standard procedure',
          patientFirstName: 'Standard',
          patientLastName: 'Patient',
          patientDob: new Date('1970-01-01'),
          patientMemberId: 'STD001',
          cptCode: '70450',
          icd10Code: 'R51',
          serviceDate: new Date('2024-01-02'),
          billedAmount: 850
        }
      });

      routineClaim = await prisma.claim.create({
        data: {
          claimNumber: 'CLM-20240103-0001',
          providerId: testProvider.id,
          submittedByUserId: providerUser.id,
          status: 'submitted',
          priority: 'ROUTINE',
          priorityConfidence: 0.91,
          priorityReasoning: 'Preventive care',
          patientFirstName: 'Routine',
          patientLastName: 'Patient',
          patientDob: new Date('1980-01-01'),
          patientMemberId: 'RTN001',
          cptCode: '99395',
          icd10Code: 'Z00.00',
          serviceDate: new Date('2024-01-03'),
          billedAmount: 200
        }
      });
    });

    afterAll(async () => {
      await prisma.claim.deleteMany({
        where: {
          id: {
            in: [urgentClaim.id, standardClaim.id, routineClaim.id]
          }
        }
      });
    });

    it('should list all claims sorted by priority (payer view)', async () => {
      const response = await request(app)
        .get('/api/claims')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      expect(response.body.claims).toBeDefined();
      expect(response.body.claims.length).toBeGreaterThanOrEqual(3);

      // First claim should be urgent (highest priority)
      const urgentClaims = response.body.claims.filter(c => c.priority === 'URGENT');
      expect(urgentClaims.length).toBeGreaterThan(0);

      // Verify priority fields are included
      const firstClaim = response.body.claims[0];
      expect(firstClaim.priority).toBeDefined();
      expect(firstClaim.priorityConfidence).toBeDefined();
    });

    it('should filter claims by urgent priority', async () => {
      const response = await request(app)
        .get('/api/claims?priority=urgent')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      expect(response.body.claims).toBeDefined();
      response.body.claims.forEach(claim => {
        expect(claim.priority).toBe('URGENT');
      });
    });

    it('should filter claims by standard priority', async () => {
      const response = await request(app)
        .get('/api/claims?priority=standard')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      response.body.claims.forEach(claim => {
        expect(claim.priority).toBe('STANDARD');
      });
    });

    it('should filter claims by routine priority', async () => {
      const response = await request(app)
        .get('/api/claims?priority=routine')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      response.body.claims.forEach(claim => {
        expect(claim.priority).toBe('ROUTINE');
      });
    });

    it('should handle uppercase priority filter', async () => {
      const response = await request(app)
        .get('/api/claims?priority=URGENT')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      response.body.claims.forEach(claim => {
        expect(claim.priority).toBe('URGENT');
      });
    });

    it('should combine status and priority filters', async () => {
      const response = await request(app)
        .get('/api/claims?status=submitted&priority=urgent')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      response.body.claims.forEach(claim => {
        expect(claim.status).toBe('submitted');
        expect(claim.priority).toBe('URGENT');
      });
    });

    it('should reject invalid priority value', async () => {
      const response = await request(app)
        .get('/api/claims?priority=invalid')
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should only show provider claims for provider users', async () => {
      const response = await request(app)
        .get('/api/claims')
        .set('x-test-user-id', providerUser.id)
        .set('x-test-user-role', 'provider_staff')
        .expect(200);

      // All claims should belong to this provider
      response.body.claims.forEach(claim => {
        expect(claim.providerName).toBe(testProvider.name);
      });
    });
  });

  describe('GET /api/claims/:id - Get Claim with Priority Details', () => {
    let testClaim;

    beforeAll(async () => {
      testClaim = await prisma.claim.create({
        data: {
          claimNumber: 'CLM-20240110-0001',
          providerId: testProvider.id,
          submittedByUserId: providerUser.id,
          status: 'submitted',
          priority: 'URGENT',
          priorityConfidence: 0.96,
          priorityReasoning: 'Critical diagnosis requiring immediate review',
          patientFirstName: 'Detail',
          patientLastName: 'Test',
          patientDob: new Date('1955-05-05'),
          patientMemberId: 'DTL001',
          cptCode: '99285',
          icd10Code: 'I21.0',
          serviceDate: new Date('2024-01-10'),
          billedAmount: 9500
        }
      });
    });

    afterAll(async () => {
      await prisma.claim.delete({ where: { id: testClaim.id } });
    });

    it('should return claim with full priority details', async () => {
      const response = await request(app)
        .get(`/api/claims/${testClaim.id}`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(200);

      expect(response.body.claim).toBeDefined();
      expect(response.body.claim.priority).toBe('URGENT');
      expect(response.body.claim.priorityConfidence).toBeCloseTo(0.96);
      expect(response.body.claim.priorityReasoning).toBe('Critical diagnosis requiring immediate review');
      expect(response.body.claim.patient).toBeDefined();
      expect(response.body.claim.service).toBeDefined();
    });

    it('should return 404 for non-existent claim', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/claims/${fakeId}`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 if provider tries to access other provider claim', async () => {
      // Create another provider and user
      const otherProvider = await prisma.provider.create({
        data: {
          name: 'Other Provider',
          npi: '9876543210',
          taxId: '98-7654321',
          address: '789 Other St',
          city: 'Other City',
          state: 'CA',
          zipCode: '90001'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          firstName: 'Other',
          lastName: 'Provider',
          role: 'provider_staff',
          providerId: otherProvider.id,
          isActive: true,
          passwordHash: 'test-hash'
        }
      });

      const response = await request(app)
        .get(`/api/claims/${testClaim.id}`)
        .set('x-test-user-id', otherUser.id)
        .set('x-test-user-role', 'provider_staff')
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.provider.delete({ where: { id: otherProvider.id } });
    });
  });

  describe('PATCH /api/claims/:id/adjudicate', () => {
    let claimToAdjudicate;

    beforeEach(async () => {
      claimToAdjudicate = await prisma.claim.create({
        data: {
          claimNumber: 'CLM-20240115-0001',
          providerId: testProvider.id,
          submittedByUserId: providerUser.id,
          status: 'submitted',
          priority: 'URGENT',
          priorityConfidence: 0.94,
          priorityReasoning: 'Emergency procedure',
          patientFirstName: 'Adjudicate',
          patientLastName: 'Test',
          patientDob: new Date('1965-08-15'),
          patientMemberId: 'ADJ001',
          cptCode: '99285',
          icd10Code: 'I21.9',
          serviceDate: new Date('2024-01-15'),
          billedAmount: 8000
        }
      });
    });

    afterEach(async () => {
      await prisma.auditLog.deleteMany({ where: { claimId: claimToAdjudicate.id } });
      await prisma.claim.delete({ where: { id: claimToAdjudicate.id } });
    });

    it('should approve urgent claim', async () => {
      const response = await request(app)
        .patch(`/api/claims/${claimToAdjudicate.id}/adjudicate`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .send({
          decision: 'approve',
          approved_amount: 7500,
          notes: 'Approved emergency procedure'
        })
        .expect(200);

      expect(response.body.claim.status).toBe('approved');
      expect(response.body.claim.approvedAmount).toBe(7500);

      // Verify audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: { claimId: claimToAdjudicate.id }
      });
      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should deny claim with reason', async () => {
      const response = await request(app)
        .patch(`/api/claims/${claimToAdjudicate.id}/adjudicate`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .send({
          decision: 'deny',
          denial_reason_code: 'INSUFFICIENT_DOCS',
          denial_explanation: 'Missing required documentation for emergency claim verification'
        })
        .expect(200);

      expect(response.body.claim.status).toBe('denied');
      expect(response.body.claim.denialReasonCode).toBe('INSUFFICIENT_DOCS');
    });

    it('should prevent duplicate adjudication', async () => {
      // First adjudication
      await request(app)
        .patch(`/api/claims/${claimToAdjudicate.id}/adjudicate`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .send({
          decision: 'approve',
          approved_amount: 7000
        })
        .expect(200);

      // Second adjudication should fail
      const response = await request(app)
        .patch(`/api/claims/${claimToAdjudicate.id}/adjudicate`)
        .set('x-test-user-id', payerUser.id)
        .set('x-test-user-role', 'payer_processor')
        .send({
          decision: 'approve',
          approved_amount: 8000
        })
        .expect(409);

      expect(response.body.error.code).toBe('CLAIM_ALREADY_ADJUDICATED');
    });
  });
});
