const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all providers
 */
const getProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        npi: true,
        city: true,
        state: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      providers
    });
  } catch (error) {
    console.error('Get providers error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve providers'
      }
    });
  }
};

/**
 * Get all payers
 */
const getPayers = async (req, res) => {
  try {
    const payers = await prisma.payer.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      payers
    });
  } catch (error) {
    console.error('Get payers error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve payers'
      }
    });
  }
};

module.exports = {
  getProviders,
  getPayers
};
