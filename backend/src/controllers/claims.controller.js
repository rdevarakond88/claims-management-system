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

module.exports = {
  createClaim,
  listClaims,
  getClaimById
};
