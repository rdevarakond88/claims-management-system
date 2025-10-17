const claimService = require('../services/claim.service');

/**
 * Create new claim (Provider only)
 */
const createClaim = async (req, res) => {
  try {
    const { patient, service } = req.body;

    // Validation
    if (!patient || !service) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Patient and service information are required',
          details: {}
        }
      });
    }

    // Validate patient fields
    const patientErrors = {};
    if (!patient.firstName) patientErrors['patient.firstName'] = 'First name is required';
    if (!patient.lastName) patientErrors['patient.lastName'] = 'Last name is required';
    if (!patient.dateOfBirth) patientErrors['patient.dateOfBirth'] = 'Date of birth is required';
    if (!patient.memberId) patientErrors['patient.memberId'] = 'Member ID is required';

    // Validate service fields
    const serviceErrors = {};
    if (!service.cptCode) serviceErrors['service.cptCode'] = 'CPT code is required';
    if (!service.icd10Code) serviceErrors['service.icd10Code'] = 'ICD-10 code is required';
    if (!service.serviceDate) serviceErrors['service.serviceDate'] = 'Service date is required';
    if (!service.billedAmount || service.billedAmount <= 0) {
      serviceErrors['service.billedAmount'] = 'Billed amount must be greater than 0';
    }

    const allErrors = { ...patientErrors, ...serviceErrors };
    if (Object.keys(allErrors).length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: allErrors
        }
      });
    }

    // Create claim
    const claim = await claimService.createClaim(req.body, req.session.userId);

    return res.status(201).json({ claim });

  } catch (error) {
    console.error('Create claim error:', error);

    if (error.message === 'User must be associated with a provider') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create claim'
      }
    });
  }
};

/**
 * List claims (filtered by user role)
 */
const listClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};

    if (status) {
      filters.status = status;
    }

    const claims = await claimService.listClaims(
      req.session.userId,
      req.session.userRole,
      filters
    );

    return res.status(200).json({
      claims,
      total: claims.length
    });

  } catch (error) {
    console.error('List claims error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve claims'
      }
    });
  }
};

/**
 * Get single claim details
 */
const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await claimService.getClaimById(
      id,
      req.session.userId,
      req.session.userRole
    );

    return res.status(200).json({ claim });

  } catch (error) {
    console.error('Get claim error:', error);

    if (error.message === 'Claim not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Claim not found'
        }
      });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this claim'
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve claim'
      }
    });
  }
};

/**
 * Adjudicate a claim (Payer only)
 */
const adjudicateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, approved_amount, notes, denial_reason_code, denial_explanation } = req.body;

    // Validate decision
    if (!decision) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Decision is required',
          details: {
            decision: 'Decision must be either "approve" or "deny"'
          }
        }
      });
    }

    if (!['approve', 'deny'].includes(decision)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid decision value',
          details: {
            decision: 'Decision must be either "approve" or "deny"'
          }
        }
      });
    }

    // Validate based on decision type
    const validationErrors = {};

    if (decision === 'approve') {
      if (!approved_amount) {
        validationErrors.approved_amount = 'Approved amount is required for approval';
      } else if (approved_amount <= 0) {
        validationErrors.approved_amount = 'Approved amount must be greater than 0';
      }

      if (notes && notes.length > 500) {
        validationErrors.notes = 'Notes cannot exceed 500 characters';
      }
    } else if (decision === 'deny') {
      if (!denial_reason_code) {
        validationErrors.denial_reason_code = 'Denial reason code is required for denial';
      } else {
        const validReasonCodes = [
          'INVALID_CPT',
          'INVALID_DIAGNOSIS',
          'NOT_COVERED',
          'PATIENT_INELIGIBLE',
          'DUPLICATE_CLAIM',
          'INSUFFICIENT_DOCS',
          'OTHER'
        ];

        if (!validReasonCodes.includes(denial_reason_code)) {
          validationErrors.denial_reason_code = 'Invalid denial reason code';
        }
      }

      if (!denial_explanation) {
        validationErrors.denial_explanation = 'Denial explanation is required for denial';
      } else if (denial_explanation.length < 20) {
        validationErrors.denial_explanation = 'Denial explanation must be at least 20 characters';
      } else if (denial_explanation.length > 1000) {
        validationErrors.denial_explanation = 'Denial explanation cannot exceed 1000 characters';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid adjudication data',
          details: validationErrors
        }
      });
    }

    // Prepare adjudication data
    const adjudicationData = {};
    if (decision === 'approve') {
      adjudicationData.approvedAmount = approved_amount;
      if (notes) {
        adjudicationData.notes = notes;
      }
    } else {
      adjudicationData.denialReasonCode = denial_reason_code;
      adjudicationData.denialExplanation = denial_explanation;
    }

    // Call service
    const claim = await claimService.adjudicateClaim(
      id,
      decision,
      req.session.userId,
      adjudicationData
    );

    return res.status(200).json({ claim });

  } catch (error) {
    console.error('Adjudicate claim error:', error);

    if (error.message === 'Claim not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Claim not found'
        }
      });
    }

    if (error.message === 'Claim has already been adjudicated') {
      return res.status(409).json({
        error: {
          code: 'CLAIM_ALREADY_ADJUDICATED',
          message: 'This claim has already been adjudicated'
        }
      });
    }

    if (error.message === 'Approved amount cannot exceed billed amount') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid adjudication data',
          details: {
            approved_amount: 'Approved amount cannot exceed billed amount'
          }
        }
      });
    }

    // Handle other validation errors from service
    if (error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('cannot exceed') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: {}
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to adjudicate claim'
      }
    });
  }
};

module.exports = {
  createClaim,
  listClaims,
  getClaimById,
  adjudicateClaim
};
