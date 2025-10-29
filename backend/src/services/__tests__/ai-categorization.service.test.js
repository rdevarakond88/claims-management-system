/**
 * Unit Tests for AI Categorization Service
 */

// Mock Anthropic SDK BEFORE importing the service
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }));
});

const {
  categorizeClaim,
  calculateAge,
  buildCategorizationPrompt,
  parseAIResponse,
  CONFIG
} = require('../ai-categorization.service');

describe('AI Categorization Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockCreate.mockReset();

    // Set up environment variables for testing
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    process.env.AI_CATEGORIZATION_ENABLED = 'true';
    process.env.AI_CATEGORIZATION_TIMEOUT = '5000';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_CATEGORIZATION_ENABLED;
    delete process.env.AI_CATEGORIZATION_TIMEOUT;
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const dob = new Date('1965-03-15');
      const age = calculateAge(dob);

      // Age should be around 59-60 depending on current date
      expect(age).toBeGreaterThanOrEqual(59);
      expect(age).toBeLessThanOrEqual(60);
    });

    it('should handle null DOB', () => {
      expect(calculateAge(null)).toBeNull();
    });

    it('should handle undefined DOB', () => {
      expect(calculateAge(undefined)).toBeNull();
    });

    it('should calculate age for recent birth date', () => {
      const dob = new Date('2020-01-01');
      const age = calculateAge(dob);
      expect(age).toBeGreaterThanOrEqual(4);
      expect(age).toBeLessThanOrEqual(5);
    });
  });

  describe('buildCategorizationPrompt', () => {
    it('should build prompt with all data', () => {
      const claimData = {
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500,
        patientAge: 59
      };

      const prompt = buildCategorizationPrompt(claimData);

      expect(prompt).toContain('99285');
      expect(prompt).toContain('I21.9');
      expect(prompt).toContain('$8500.00');
      expect(prompt).toContain('59 years');
      expect(prompt).toContain('URGENT');
      expect(prompt).toContain('STANDARD');
      expect(prompt).toContain('ROUTINE');
    });

    it('should build prompt without patient age', () => {
      const claimData = {
        cptCode: '99213',
        icd10Code: 'Z00.00',
        billedAmount: 150
      };

      const prompt = buildCategorizationPrompt(claimData);

      expect(prompt).toContain('99213');
      expect(prompt).toContain('Z00.00');
      expect(prompt).toContain('$150.00');
      expect(prompt).not.toContain('Patient Age');
    });
  });

  describe('parseAIResponse', () => {
    it('should parse valid JSON response', () => {
      const responseText = JSON.stringify({
        priority: 'URGENT',
        confidence: 0.95,
        reasoning: 'Emergency procedure with high cost'
      });

      const result = parseAIResponse(responseText);

      expect(result).toEqual({
        priority: 'URGENT',
        confidence: 0.95,
        reasoning: 'Emergency procedure with high cost'
      });
    });

    it('should handle invalid priority value', () => {
      const responseText = JSON.stringify({
        priority: 'INVALID',
        confidence: 0.8,
        reasoning: 'Test'
      });

      const result = parseAIResponse(responseText);

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('parsing failed');
    });

    it('should handle invalid JSON', () => {
      const responseText = 'Not valid JSON';

      const result = parseAIResponse(responseText);

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('parsing failed');
    });

    it('should validate confidence range', () => {
      const responseText = JSON.stringify({
        priority: 'URGENT',
        confidence: 1.5, // Invalid - over 1.0
        reasoning: 'Test'
      });

      const result = parseAIResponse(responseText);

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
    });

    it('should require reasoning field', () => {
      const responseText = JSON.stringify({
        priority: 'URGENT',
        confidence: 0.95
        // Missing reasoning
      });

      const result = parseAIResponse(responseText);

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
    });
  });

  describe('categorizeClaim', () => {
    it('should categorize urgent claim (emergency, high cost)', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'URGENT',
            confidence: 0.95,
            reasoning: 'Emergency department visit for acute myocardial infarction with high cost'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500,
        patientDob: new Date('1965-03-15')
      });

      expect(result.priority).toBe('URGENT');
      expect(result.confidence).toBe(0.95);
      expect(result.reasoning).toContain('Emergency');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should categorize routine claim (preventive, low cost)', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'ROUTINE',
            confidence: 0.91,
            reasoning: 'Preventive annual wellness visit, standard screening'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '99395',
        icd10Code: 'Z00.00',
        billedAmount: 200
      });

      expect(result.priority).toBe('ROUTINE');
      expect(result.confidence).toBe(0.91);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should categorize standard claim (moderate cost)', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'STANDARD',
            confidence: 0.85,
            reasoning: 'Diagnostic imaging for non-urgent condition with moderate cost'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '70450',
        icd10Code: 'R51',
        billedAmount: 850
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.85);
    });

    it('should throw error for missing cptCode', async () => {
      await expect(categorizeClaim({
        icd10Code: 'I21.9',
        billedAmount: 8500
      })).rejects.toThrow('cptCode is required');
    });

    it('should throw error for missing icd10Code', async () => {
      await expect(categorizeClaim({
        cptCode: '99285',
        billedAmount: 8500
      })).rejects.toThrow('icd10Code is required');
    });

    it('should throw error for missing billedAmount', async () => {
      await expect(categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9'
      })).rejects.toThrow('billedAmount is required');
    });

    it('should throw error for invalid billedAmount', async () => {
      await expect(categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: -100
      })).rejects.toThrow('billedAmount is required and must be a positive number');
    });

    it('should return default priority when AI is disabled', async () => {
      // Note: Since CONFIG is loaded at module import time, we can't change it dynamically in tests
      // This test would need module reloading which is complex in Jest
      // Instead, we'll test that the service handles the disabled state correctly
      // by checking if the environment variable works when set before module load

      // For this test, we'll verify the behavior matches the implementation
      // The actual disabled check happens before API calls
      const originalEnabled = process.env.AI_CATEGORIZATION_ENABLED;
      process.env.AI_CATEGORIZATION_ENABLED = 'false';

      // Re-require the module to pick up the new env var
      jest.resetModules();
      const { categorizeClaim: categorizeClaim2 } = require('../ai-categorization.service');

      const result = await categorizeClaim2({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('disabled');

      // Restore
      process.env.AI_CATEGORIZATION_ENABLED = originalEnabled;
    });

    it('should return default priority when API key is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('not configured');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle API timeout gracefully', async () => {
      // Mock API call to delay longer than timeout
      mockCreate.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('timeout');
    });

    it('should handle API error gracefully', async () => {
      mockCreate.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('error');
    });

    it('should handle malformed AI response', async () => {
      const mockResponse = {
        content: [{
          text: 'This is not JSON'
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
      });

      expect(result.priority).toBe('STANDARD');
      expect(result.confidence).toBe(0.0);
      expect(result.reasoning).toContain('parsing failed');
    });

    it('should work without patient DOB', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'URGENT',
            confidence: 0.92,
            reasoning: 'Emergency procedure'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '99285',
        icd10Code: 'I21.9',
        billedAmount: 8500
        // No patientDob provided
      });

      expect(result.priority).toBe('URGENT');
      expect(result.confidence).toBe(0.92);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high billed amounts', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'URGENT',
            confidence: 0.98,
            reasoning: 'Extremely high-cost procedure indicating major surgery'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '27447',
        icd10Code: 'M17.11',
        billedAmount: 50000
      });

      expect(result.priority).toBe('URGENT');
    });

    it('should handle very low billed amounts', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            priority: 'ROUTINE',
            confidence: 0.94,
            reasoning: 'Very low cost indicates minor procedure'
          })
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await categorizeClaim({
        cptCode: '90471',
        icd10Code: 'Z23',
        billedAmount: 25
      });

      expect(result.priority).toBe('ROUTINE');
    });
  });
});
