import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from "../api/client";

const ClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/claims/${id}`);
        // API returns { claim: {...} }, so extract the claim object
        setClaim(response.data.claim);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load claim details');
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Claim</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!claim) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {/* Claim Header */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Claim #{claim.claimNumber}</h1>
              <p className="mt-1 text-sm text-gray-500">Submitted on {formatDate(claim.submittedAt)}</p>
            </div>
            <div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadgeColor(claim.status)}`}>
                {claim.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Patient Name</p>
                <p className="mt-1 text-sm text-gray-900">
                  {claim.patient?.firstName && claim.patient?.lastName
                    ? `${claim.patient.firstName} ${claim.patient.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(claim.patient?.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Member ID</p>
                <p className="mt-1 text-sm text-gray-900 font-mono">{claim.patient?.memberId || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Provider Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Provider Name</p>
                <p className="mt-1 text-sm text-gray-900">{claim.provider?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">NPI</p>
                <p className="mt-1 text-sm text-gray-900 font-mono">{claim.provider?.npi || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Service Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">CPT Code</p>
              <p className="mt-1 text-sm text-gray-900 font-mono">{claim.service?.cptCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ICD-10 Code</p>
              <p className="mt-1 text-sm text-gray-900 font-mono">{claim.service?.icd10Code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Service Date</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(claim.service?.serviceDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Billed Amount</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(claim.service?.billedAmount)}</p>
            </div>
          </div>
        </div>

        {/* Adjudication Details - Only show if claim is adjudicated */}
        {(claim.status === 'approved' || claim.status === 'denied') && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Adjudication Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.status === 'approved' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved Amount</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(claim.approvedAmount)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Adjudicated Date</p>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(claim.adjudicatedAt)}</p>
              </div>
              {claim.adjudicatedBy && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Adjudicated By</p>
                  <p className="mt-1 text-sm text-gray-900">{claim.adjudicatedBy.name || 'N/A'}</p>
                </div>
              )}
              {claim.status === 'denied' && claim.denialReasonCode && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Denial Reason Code</p>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{claim.denialReasonCode}</p>
                </div>
              )}
              {claim.status === 'denied' && claim.denialExplanation && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Denial Explanation</p>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{claim.denialExplanation}</p>
                </div>
              )}
              {claim.adjudicationNotes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{claim.adjudicationNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        {claim.auditTrail && claim.auditTrail.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Audit Trail
            </h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {claim.auditTrail.map((entry, idx) => (
                  <li key={entry.id}>
                    <div className="relative pb-8">
                      {idx !== claim.auditTrail.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{entry.action}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              by {entry.performedBy} on {formatDateTime(entry.timestamp)}
                            </p>
                          </div>
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <div className="mt-2 text-sm bg-gray-50 p-3 rounded-md">
                              <dl className="grid grid-cols-1 gap-2">
                                {Object.entries(entry.details).map(([key, value]) => (
                                  <div key={key} className="flex">
                                    <dt className="font-medium text-gray-600 mr-2 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </dt>
                                    <dd className="text-gray-900">{String(value)}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimDetailPage;
