const adminService = require('../services/admin.service');

/**
 * List all users with optional filtering
 */
const listUsers = async (req, res) => {
  try {
    const { role, is_active } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.isActive = is_active === 'true';

    const users = await adminService.getAllUsers(filters);

    return res.status(200).json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching users'
      }
    });
  }
};

/**
 * Create new user with temporary password
 */
const createUser = async (req, res) => {
  try {
    const { email, first_name, last_name, role, organization_id } = req.body;

    // Validate input
    const validationErrors = validateUserInput(req.body);
    if (validationErrors) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors
        }
      });
    }

    // Create user
    const result = await adminService.createUserWithTempPassword({
      email,
      firstName: first_name,
      lastName: last_name,
      role,
      organizationId: organization_id
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: result.user,
      temporary_password: result.temporaryPassword
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'An account with this email already exists'
        }
      });
    }

    if (error.code === 'INVALID_ORGANIZATION') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            organization_id: error.message
          }
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating user'
      }
    });
  }
};

/**
 * Validate user input data
 * @param {Object} data - Request body
 * @returns {Object|null} Validation errors or null if valid
 */
function validateUserInput(data) {
  const errors = {};

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // First name validation
  if (!data.first_name || data.first_name.trim().length === 0) {
    errors.first_name = 'First name is required';
  } else if (data.first_name.length > 100) {
    errors.first_name = 'First name must be less than 100 characters';
  }

  // Last name validation
  if (!data.last_name || data.last_name.trim().length === 0) {
    errors.last_name = 'Last name is required';
  } else if (data.last_name.length > 100) {
    errors.last_name = 'Last name must be less than 100 characters';
  }

  // Role validation
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['provider_staff', 'payer_processor'].includes(data.role)) {
    errors.role = 'Role must be either "provider_staff" or "payer_processor"';
  }

  // Organization validation
  if (!data.organization_id) {
    errors.organization_id = 'Organization is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

module.exports = {
  listUsers,
  createUser
};
