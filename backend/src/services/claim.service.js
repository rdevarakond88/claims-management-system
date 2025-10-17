const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate unique claim number in format CLM-YYYYMMDD-####
 */
const generateClaimNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `CLM-${year}${month}${day}`;

  // Find the last claim number for today
  const lastClaim = await prisma.claim.findFirst({
    where: {
      claimNumber: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      claimNumber: 'desc'
    }
  });

  let sequence = 1;
  if (lastClaim) {
    // Extract sequence number from last claim
    const lastSequence = parseInt(lastClaim.claimNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `${datePrefix}-${sequenceStr}`;
};

/**
 * Create a new claim
 * @param {Object} claimData - Claim information
 * @param {string} userId - ID of user submitting claim
 * @returns {Object} Created claim with details
 */
const createClaim = async (claimData, userId) => {
  const { patient, service } = claimData;

  // Get user info to determine provider
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: true }
  });

  if (!user || !user.providerId) {
    throw new Error('User must be associated with a provider');
  }

  // Generate claim number
  const claimNumber = await generateClaimNumber();

  // Create claim in a transaction (claim + audit log)
  const claim = await prisma.$transaction(async (tx) => {
    // Create the claim
    const newClaim = await tx.claim.create({
      data: {
        claimNumber,
        providerId: user.providerId,
        submittedByUserId: userId,
        status: 'submitted',
        patientFirstName: patient.firstName,
        patientLastName: patient.lastName,
        patientDob: new Date(patient.dateOfBirth),
        patientMemberId: patient.memberId,
        cptCode: service.cptCode,
        icd10Code: service.icd10Code,
        serviceDate: new Date(service.serviceDate),
        billedAmount: service.billedAmount
      },
      include: {
        provider: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        claimId: newClaim.id,
        userId: userId,
        action: 'submitted',
        newStatus: 'submitted',
        details: {
          claimNumber: newClaim.claimNumber,
          billedAmount: service.billedAmount.toString()
        }
      }
    });

    return newClaim;
  });

  return claim;
};

/**
 * Get claims list for a user (filtered by role)
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {Object} filters - Optional filters (status, dateRange)
 * @returns {Array} List of claims
 */
const listClaims = async (userId, userRole, filters = {}) => {
  // Build where clause based on role
  const where = {};

  if (userRole === 'provider_staff') {
    // Providers see only their claims
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { providerId: true }
    });
    where.providerId = user.providerId;
  }
  // Payers see all claims (no additional filter)

  // Apply status filter if provided
  if (filters.status) {
    where.status = filters.status;
  }

  // Get claims
  const claims = await prisma.claim.findMany({
    where,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          npi: true
        }
      },
      submittedBy: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  // Format for response
  return claims.map(claim => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    patientName: `${claim.patientFirstName} ${claim.patientLastName}`,
    serviceDate: claim.serviceDate,
    billedAmount: claim.billedAmount,
    approvedAmount: claim.approvedAmount,
    providerName: claim.provider.name,
    submittedAt: claim.submittedAt,
    adjudicatedAt: claim.adjudicatedAt,
    daysSinceSubmission: Math.floor((Date.now() - claim.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
  }));
};

/**
 * Adjudicate a claim (approve or deny)
 * @param {string} claimId - Claim ID to adjudicate
 * @param {string} decision - 'approve' or 'deny'
 * @param {string} userId - ID of user adjudicating
 * @param {Object} adjudicationData - Additional adjudication data
 * @returns {Object} Updated claim with details
 */
const adjudicateClaim = async (claimId, decision, userId, adjudicationData) => {
  // Validate decision
  if (!['approve', 'deny'].includes(decision)) {
    throw new Error('Decision must be either "approve" or "deny"');
  }

  // Get the existing claim
  const existingClaim = await prisma.claim.findUnique({
    where: { id: claimId }
  });

  if (!existingClaim) {
    throw new Error('Claim not found');
  }

  // Check if already adjudicated
  if (existingClaim.status !== 'submitted') {
    throw new Error('Claim has already been adjudicated');
  }

  // Validate based on decision type
  if (decision === 'approve') {
    const { approvedAmount, notes } = adjudicationData;

    if (!approvedAmount || approvedAmount <= 0) {
      throw new Error('Approved amount must be greater than 0');
    }

    if (approvedAmount > existingClaim.billedAmount) {
      throw new Error('Approved amount cannot exceed billed amount');
    }

    if (notes && notes.length > 500) {
      throw new Error('Notes cannot exceed 500 characters');
    }
  } else if (decision === 'deny') {
    const { denialReasonCode, denialExplanation } = adjudicationData;

    if (!denialReasonCode) {
      throw new Error('Denial reason code is required');
    }

    const validReasonCodes = [
      'INVALID_CPT',
      'INVALID_DIAGNOSIS',
      'NOT_COVERED',
      'PATIENT_INELIGIBLE',
      'DUPLICATE_CLAIM',
      'INSUFFICIENT_DOCS',
      'OTHER'
    ];

    if (!validReasonCodes.includes(denialReasonCode)) {
      throw new Error('Invalid denial reason code');
    }

    if (!denialExplanation || denialExplanation.length < 20) {
      throw new Error('Denial explanation must be at least 20 characters');
    }

    if (denialExplanation.length > 1000) {
      throw new Error('Denial explanation cannot exceed 1000 characters');
    }
  }

  // Perform adjudication in a transaction
  const updatedClaim = await prisma.$transaction(async (tx) => {
    const updateData = {
      status: decision === 'approve' ? 'approved' : 'denied',
      adjudicatedByUserId: userId,
      adjudicatedAt: new Date()
    };

    if (decision === 'approve') {
      updateData.approvedAmount = adjudicationData.approvedAmount;
      updateData.adjudicationNotes = adjudicationData.notes || null;
    } else {
      updateData.denialReasonCode = adjudicationData.denialReasonCode;
      updateData.denialExplanation = adjudicationData.denialExplanation;
    }

    // Update the claim
    const claim = await tx.claim.update({
      where: { id: claimId },
      data: updateData,
      include: {
        provider: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        adjudicatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create audit log entry
    const auditDetails = {
      status: updateData.status,
      oldStatus: existingClaim.status
    };

    if (decision === 'approve') {
      auditDetails.approvedAmount = adjudicationData.approvedAmount.toString();
      if (adjudicationData.notes) {
        auditDetails.notes = adjudicationData.notes;
      }
    } else {
      auditDetails.denialReasonCode = adjudicationData.denialReasonCode;
      auditDetails.denialExplanation = adjudicationData.denialExplanation;
    }

    await tx.auditLog.create({
      data: {
        claimId: claim.id,
        userId: userId,
        action: decision === 'approve' ? 'approved' : 'denied',
        oldStatus: existingClaim.status,
        newStatus: updateData.status,
        details: auditDetails
      }
    });

    return claim;
  });

  // Format response
  return {
    id: updatedClaim.id,
    claimNumber: updatedClaim.claimNumber,
    status: updatedClaim.status,
    approvedAmount: updatedClaim.approvedAmount,
    denialReasonCode: updatedClaim.denialReasonCode,
    denialExplanation: updatedClaim.denialExplanation,
    adjudicationNotes: updatedClaim.adjudicationNotes,
    adjudicatedBy: {
      id: updatedClaim.adjudicatedBy.id,
      name: `${updatedClaim.adjudicatedBy.firstName} ${updatedClaim.adjudicatedBy.lastName}`,
      email: updatedClaim.adjudicatedBy.email
    },
    adjudicatedAt: updatedClaim.adjudicatedAt
  };
};

/**
 * Get single claim details
 * @param {string} claimId - Claim ID
 * @param {string} userId - User ID requesting
 * @param {string} userRole - User role
 * @returns {Object} Claim details with audit trail
 */
const getClaimById = async (claimId, userId, userRole) => {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      provider: true,
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      adjudicatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      auditLogs: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!claim) {
    throw new Error('Claim not found');
  }

  // Authorization check
  if (userRole === 'provider_staff') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { providerId: true }
    });
    
    if (claim.providerId !== user.providerId) {
      throw new Error('Forbidden');
    }
  }

  // Format audit trail
  const auditTrail = claim.auditLogs.map(log => ({
    action: log.action,
    performedBy: `${log.user.firstName} ${log.user.lastName}`,
    timestamp: log.createdAt,
    details: log.details
  }));

  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    patient: {
      firstName: claim.patientFirstName,
      lastName: claim.patientLastName,
      dateOfBirth: claim.patientDob,
      memberId: claim.patientMemberId
    },
    service: {
      cptCode: claim.cptCode,
      icd10Code: claim.icd10Code,
      serviceDate: claim.serviceDate,
      billedAmount: claim.billedAmount
    },
    approvedAmount: claim.approvedAmount,
    denialReasonCode: claim.denialReasonCode,
    denialExplanation: claim.denialExplanation,
    adjudicationNotes: claim.adjudicationNotes,
    provider: {
      id: claim.provider.id,
      name: claim.provider.name,
      npi: claim.provider.npi
    },
    submittedBy: {
      id: claim.submittedBy.id,
      name: `${claim.submittedBy.firstName} ${claim.submittedBy.lastName}`,
      email: claim.submittedBy.email
    },
    adjudicatedBy: claim.adjudicatedBy ? {
      id: claim.adjudicatedBy.id,
      name: `${claim.adjudicatedBy.firstName} ${claim.adjudicatedBy.lastName}`,
      email: claim.adjudicatedBy.email
    } : null,
    submittedAt: claim.submittedAt,
    adjudicatedAt: claim.adjudicatedAt,
    auditTrail
  };
};

module.exports = {
  createClaim,
  listClaims,
  getClaimById,
  adjudicateClaim
};
