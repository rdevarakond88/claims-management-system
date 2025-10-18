import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const SubmitClaimPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError('');
    setSuccessMessage('');

    try {
      // Transform form data to match API contract
      const claimData = {
        patient: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth, // Already in YYYY-MM-DD format from date input
          memberId: data.memberId
        },
        service: {
          cptCode: data.cptCode,
          icd10Code: data.icd10Code,
          serviceDate: data.serviceDate, // Already in YYYY-MM-DD format from date input
          billedAmount: parseFloat(data.billedAmount)
        }
      };

      // Debug log to verify payload format
      console.log('Submitting claim with payload:', claimData);

      const response = await apiClient.post('/claims', claimData);

      // Show success message
      setSuccessMessage(`Claim ${response.data.claim.claim_number} submitted successfully!`);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Claim submission failed:', error);

      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;

        if (errorData.error?.details) {
          // Validation errors with field details
          const fieldErrors = Object.entries(errorData.error.details)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setSubmitError(fieldErrors);
        } else {
          setSubmitError(errorData.error?.message || 'Failed to submit claim');
        }
      } else if (error.request) {
        // Request made but no response
        setSubmitError('Unable to connect to server. Please try again.');
      } else {
        // Something else happened
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">
                Claims Management System
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Submit New Claim</h2>
          <p className="text-gray-600">Complete the form below to submit a new healthcare claim</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{submitError}</span>
            </div>
          </div>
        )}

        {/* Claim Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md">
          {/* Patient Information Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 1,
                      message: 'First name must be at least 1 character'
                    },
                    maxLength: {
                      value: 100,
                      message: 'First name must not exceed 100 characters'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 1,
                      message: 'Last name must be at least 1 character'
                    },
                    maxLength: {
                      value: 100,
                      message: 'Last name must not exceed 100 characters'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Smith"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required',
                    validate: {
                      notFuture: (value) => {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate <= today || 'Date of birth cannot be in the future';
                      },
                      under120: (value) => {
                        const selectedDate = new Date(value);
                        const maxAge = new Date();
                        maxAge.setFullYear(maxAge.getFullYear() - 120);
                        return selectedDate >= maxAge || 'Person must be under 120 years old';
                      }
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Member ID */}
              <div>
                <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-2">
                  Member ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="memberId"
                  type="text"
                  {...register('memberId', {
                    required: 'Member ID is required',
                    pattern: {
                      value: /^[A-Za-z0-9]{8,15}$/,
                      message: 'Member ID must be 8-15 alphanumeric characters'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.memberId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MEM123456789"
                />
                {errors.memberId && (
                  <p className="mt-1 text-sm text-red-600">{errors.memberId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPT Code */}
              <div>
                <label htmlFor="cptCode" className="block text-sm font-medium text-gray-700 mb-2">
                  CPT Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="cptCode"
                  type="text"
                  {...register('cptCode', {
                    required: 'CPT code is required',
                    pattern: {
                      value: /^\d{5}$/,
                      message: 'CPT code must be exactly 5 digits'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.cptCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="99213"
                  maxLength={5}
                />
                {errors.cptCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.cptCode.message}</p>
                )}
              </div>

              {/* ICD-10 Code */}
              <div>
                <label htmlFor="icd10Code" className="block text-sm font-medium text-gray-700 mb-2">
                  ICD-10 Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="icd10Code"
                  type="text"
                  {...register('icd10Code', {
                    required: 'ICD-10 code is required',
                    pattern: {
                      value: /^[A-Z]\d{2}(\.\d{1,4})?$/,
                      message: 'ICD-10 code must be in valid format (e.g., E11.9 or E11)'
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.icd10Code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="E11.9"
                />
                {errors.icd10Code && (
                  <p className="mt-1 text-sm text-red-600">{errors.icd10Code.message}</p>
                )}
              </div>

              {/* Service Date */}
              <div>
                <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="serviceDate"
                  type="date"
                  {...register('serviceDate', {
                    required: 'Service date is required',
                    validate: {
                      notFuture: (value) => {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate <= today || 'Service date cannot be in the future';
                      },
                      within365Days: (value) => {
                        const selectedDate = new Date(value);
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        return selectedDate >= oneYearAgo || 'Service date must be within the last 365 days';
                      }
                    }
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.serviceDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.serviceDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceDate.message}</p>
                )}
              </div>

              {/* Billed Amount */}
              <div>
                <label htmlFor="billedAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Billed Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                  <input
                    id="billedAmount"
                    type="number"
                    step="0.01"
                    {...register('billedAmount', {
                      required: 'Billed amount is required',
                      validate: {
                        positive: (value) => parseFloat(value) > 0 || 'Amount must be positive',
                        maxAmount: (value) => parseFloat(value) <= 999999.99 || 'Amount cannot exceed $999,999.99'
                      }
                    })}
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.billedAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="150.00"
                  />
                </div>
                {errors.billedAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.billedAmount.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Claim'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitClaimPage;
