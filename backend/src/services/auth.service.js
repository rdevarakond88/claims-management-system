const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Authenticate user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} user object (without password)
 */
const authenticateUser = async (email, password) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      provider: true,
      payer: true
    }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Remove password hash before returning
  const { passwordHash, ...userWithoutPassword } = user;
  
  return userWithoutPassword;
};

/**
 * Create a new user (for seeding/testing)
 * @param {Object} userData 
 * @returns {Object} created user
 */
const createUser = async (userData) => {
  const { email, password, role, providerId, payerId, firstName, lastName } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      providerId,
      payerId,
      firstName,
      lastName
    },
    include: {
      provider: true,
      payer: true
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = {
  authenticateUser,
  createUser
};
