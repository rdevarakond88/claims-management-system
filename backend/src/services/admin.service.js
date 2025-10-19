const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { generateTemporaryPassword } = require('../utils/passwordGenerator');

const prisma = new PrismaClient();

/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters (role, isActive)
 * @returns {Array} Array of user objects
 */
const getAllUsers = async (filters = {}) => {
  const users = await prisma.user.findMany({
    where: filters,
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
      isFirstLogin: true,
      lastLogin: true,
      createdAt: true,
      provider: {
        select: {
          id: true,
          name: true
        }
      },
      payer: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Format response to match API contract
  return users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.firstName,
    last_name: user.lastName,
    is_active: user.isActive,
    is_first_login: user.isFirstLogin,
    organization: user.provider ? {
      id: user.provider.id,
      name: user.provider.name,
      type: 'provider'
    } : user.payer ? {
      id: user.payer.id,
      name: user.payer.name,
      type: 'payer'
    } : null,
    last_login: user.lastLogin,
    created_at: user.createdAt
  }));
};

/**
 * Create user with temporary password
 * @param {Object} userData - User data (email, firstName, lastName, role, organizationId)
 * @returns {Object} Created user and temporary password
 */
const createUserWithTempPassword = async (userData) => {
  const { email, firstName, lastName, role, organizationId } = userData;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  // Validate organization exists and matches role
  const isProvider = role === 'provider_staff';
  const orgTable = isProvider ? 'provider' : 'payer';

  const organization = await prisma[orgTable].findUnique({
    where: { id: organizationId }
  });

  if (!organization) {
    const error = new Error('Organization not found or does not match role type');
    error.code = 'INVALID_ORGANIZATION';
    throw error;
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role,
      firstName,
      lastName,
      isFirstLogin: true,
      ...(isProvider ? { providerId: organizationId } : { payerId: organizationId })
    },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isFirstLogin: true,
      createdAt: true,
      provider: {
        select: {
          id: true,
          name: true
        }
      },
      payer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      is_first_login: user.isFirstLogin,
      organization: user.provider ? {
        id: user.provider.id,
        name: user.provider.name
      } : {
        id: user.payer.id,
        name: user.payer.name
      },
      created_at: user.createdAt
    },
    temporaryPassword
  };
};

module.exports = {
  getAllUsers,
  createUserWithTempPassword
};
