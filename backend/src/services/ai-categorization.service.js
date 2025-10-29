/**
 * AI Categorization Service
 *
 * Uses Anthropic Claude API to automatically categorize claims by priority
 * based on CPT code, ICD-10 code, billed amount, and clinical urgency indicators.
 *
 * Priority Levels:
 * - URGENT: Emergency procedures, critical diagnoses, high-cost claims (>$5,000)
 * - STANDARD: Routine hospitalizations, moderate procedures ($500-$5,000)
 * - ROUTINE: Preventive care, checkups, low-cost procedures (<$500)
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Configuration
const CONFIG = {
  model: process.env.AI_CATEGORIZATION_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.AI_CATEGORIZATION_MAX_TOKENS) || 500,
  timeout: parseInt(process.env.AI_CATEGORIZATION_TIMEOUT) || 5000,
  enabled: process.env.AI_CATEGORIZATION_ENABLED !== 'false'
};

/**
 * Calculate patient age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Build the AI categorization prompt
 * @param {Object} claimData - Claim data including CPT, ICD-10, amount, patient age
 * @returns {string} Formatted prompt for AI
 */
function buildCategorizationPrompt(claimData) {
  const { cptCode, icd10Code, billedAmount, patientAge } = claimData;

  return `You are a medical claims categorization expert. Analyze the following healthcare claim and categorize it by priority level.

**Claim Details:**
- CPT Code: ${cptCode}
- ICD-10 Diagnosis Code: ${icd10Code}
- Billed Amount: $${billedAmount.toFixed(2)}
${patientAge ? `- Patient Age: ${patientAge} years` : ''}

**Priority Categories:**

🔴 **URGENT** - Assign if ANY of the following apply:
- Emergency department visits (CPT 99281-99285)
- Life-threatening conditions (heart attack, stroke, severe trauma, etc.)
- High-cost claims (>$5,000) indicating major procedures
- Critical care or intensive care services
- Time-sensitive treatments requiring immediate processing

🟡 **STANDARD** - Assign if:
- Routine hospitalizations or surgeries
- Moderate-cost procedures ($500-$5,000)
- Non-emergency but medically necessary care
- Diagnostic imaging for non-urgent conditions
- Chronic disease management visits

🟢 **ROUTINE** - Assign if:
- Preventive care (annual physicals, vaccinations)
- Well visits and health screenings
- Low-cost procedures (<$500)
- Minor acute conditions (colds, minor injuries)
- Follow-up visits for resolved conditions

**Instructions:**
1. Consider CPT code context (emergency vs routine)
2. Evaluate ICD-10 severity (life-threatening vs minor)
3. Factor in cost as an indicator of procedure complexity
4. Provide your reasoning in 1-2 sentences

**Response Format (JSON only):**
{
  "priority": "URGENT" | "STANDARD" | "ROUTINE",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation (1-2 sentences)"
}

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Parse AI response and validate structure
 * @param {string} responseText - Raw response from AI
 * @returns {Object} Parsed categorization result
 */
function parseAIResponse(responseText) {
  try {
    const parsed = JSON.parse(responseText);

    // Validate required fields
    if (!parsed.priority || !['URGENT', 'STANDARD', 'ROUTINE'].includes(parsed.priority)) {
      throw new Error('Invalid priority value');
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence value');
    }

    if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
      throw new Error('Missing or invalid reasoning');
    }

    return {
      priority: parsed.priority,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error.message);
    console.error('Raw response:', responseText);

    // Return fallback if parsing fails
    return {
      priority: 'STANDARD',
      confidence: 0.0,
      reasoning: 'AI response parsing failed, defaulting to standard priority'
    };
  }
}

/**
 * Categorize a claim using AI analysis
 *
 * @param {Object} claimData - Claim information
 * @param {string} claimData.cptCode - CPT procedure code
 * @param {string} claimData.icd10Code - ICD-10 diagnosis code
 * @param {number} claimData.billedAmount - Claim amount in dollars
 * @param {Date} [claimData.patientDob] - Patient date of birth (optional)
 *
 * @returns {Promise<Object>} Categorization result
 * @returns {string} result.priority - Priority level (URGENT, STANDARD, ROUTINE)
 * @returns {number} result.confidence - Confidence score (0.0-1.0)
 * @returns {string} result.reasoning - Human-readable explanation
 *
 * @throws {Error} If required fields are missing
 *
 * @example
 * const result = await categorizeClaim({
 *   cptCode: '99285',
 *   icd10Code: 'I21.9',
 *   billedAmount: 8500,
 *   patientDob: new Date('1965-03-15')
 * });
 * // result.priority === 'URGENT'
 */
async function categorizeClaim(claimData) {
  // Validate required inputs
  if (!claimData || typeof claimData !== 'object') {
    throw new Error('claimData is required and must be an object');
  }

  const { cptCode, icd10Code, billedAmount } = claimData;

  if (!cptCode || typeof cptCode !== 'string') {
    throw new Error('cptCode is required and must be a string');
  }

  if (!icd10Code || typeof icd10Code !== 'string') {
    throw new Error('icd10Code is required and must be a string');
  }

  if (typeof billedAmount !== 'number' || billedAmount <= 0) {
    throw new Error('billedAmount is required and must be a positive number');
  }

  // Check if AI categorization is enabled
  if (!CONFIG.enabled) {
    console.log('AI categorization is disabled, returning default priority');
    return {
      priority: 'STANDARD',
      confidence: 0.0,
      reasoning: 'AI categorization is disabled in configuration'
    };
  }

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured, returning default priority');
    return {
      priority: 'STANDARD',
      confidence: 0.0,
      reasoning: 'AI service not configured'
    };
  }

  try {
    // Calculate patient age if DOB provided
    const patientAge = claimData.patientDob ? calculateAge(claimData.patientDob) : null;

    // Build prompt
    const prompt = buildCategorizationPrompt({
      cptCode,
      icd10Code,
      billedAmount,
      patientAge
    });

    console.log(`[AI Categorization] Analyzing claim: CPT=${cptCode}, ICD-10=${icd10Code}, Amount=$${billedAmount}`);

    // Call Anthropic API with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI categorization timeout')), CONFIG.timeout)
    );

    const apiCallPromise = anthropic.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);

    // Extract and parse response
    const responseText = response.content[0].text;
    const result = parseAIResponse(responseText);

    console.log(`[AI Categorization] Result: ${result.priority} (confidence: ${result.confidence})`);

    return result;

  } catch (error) {
    // Log error but don't block claim submission
    console.error('[AI Categorization] Error:', error.message);

    // Return fallback priority
    return {
      priority: 'STANDARD',
      confidence: 0.0,
      reasoning: `AI service error: ${error.message}. Defaulting to standard priority.`
    };
  }
}

/**
 * Batch categorize multiple claims (for future use)
 * @param {Array<Object>} claimsData - Array of claim data objects
 * @returns {Promise<Array<Object>>} Array of categorization results
 */
async function batchCategorizeClaims(claimsData) {
  if (!Array.isArray(claimsData)) {
    throw new Error('claimsData must be an array');
  }

  // Process claims sequentially to respect rate limits
  const results = [];
  for (const claimData of claimsData) {
    const result = await categorizeClaim(claimData);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

module.exports = {
  categorizeClaim,
  batchCategorizeClaims,
  calculateAge,
  buildCategorizationPrompt,
  parseAIResponse,
  CONFIG
};
