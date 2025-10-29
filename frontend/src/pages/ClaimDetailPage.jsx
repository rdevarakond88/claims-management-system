import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from "../api/client";
import { useAuth } from '../contexts/AuthContext';
import PriorityBadge from '../components/PriorityBadge';

const ClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [adjudicating, setAdjudicating] = useState(false);
  const [adjudicationError, setAdjudicationError] = useState(null);

  // Adjudication form states
  const [approvedAmount, setApprovedAmount] = useState('');
  const [denialReasonCode, setDenialReasonCode] = useState('');
  const [denialExplanation, setDenialExplanation] = useState('');
  const [adjudicationNotes, setAdjudicationNotes] = useState('');

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

  const handleApprove = () => {
    setApprovedAmount(claim.service?.billedAmount?.toString() || '');
    setAdjudicationNotes('');
    setAdjudicationError(null);
    setShowApproveModal(true);
  };

  const handleDeny = () => {
    setDenialReasonCode('');
    setDenialExplanation('');
    setAdjudicationNotes('');
    setAdjudicationError(null);
    setShowDenyModal(true);
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    setAdjudicating(true);
    setAdjudicationError(null);

    try {
      const response = await apiClient.patch(`/claims/${id}/adjudicate`, {
        decision: 'approve',
        approved_amount: parseFloat(approvedAmount),
        notes: adjudicationNotes || undefined
      });

      // Update claim with response data
      setClaim(response.data.claim);
      setShowApproveModal(false);
    } catch (err) {
      console.error('Approval error:', err.response?.data);

      // Format error message
      let errorMsg = 'Failed to approve claim';
      if (err.response?.data?.error) {
        const error = err.response.data.error;
        if (error.message) {
          errorMsg = error.message;
          // If there are validation details, append them
          if (error.details) {
            const detailMessages = Object.entries(error.details)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            errorMsg += ` - ${detailMessages}`;
          }
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
      }

      setAdjudicationError(errorMsg);
    } finally {
      setAdjudicating(false);
    }
  };

  const submitDenial = async (e) => {
    e.preventDefault();
    setAdjudicating(true);
    setAdjudicationError(null);

    try {
      const response = await apiClient.patch(`/claims/${id}/adjudicate`, {
        decision: 'deny',
        denial_reason_code: denialReasonCode,
        denial_explanation: denialExplanation,
        notes: adjudicationNotes || undefined
      });

      // Update claim with response data
      setClaim(response.data.claim);
      setShowDenyModal(false);
    } catch (err) {
      console.error('Denial error:', err.response?.data);

      // Format error message
      let errorMsg = 'Failed to deny claim';
      if (err.response?.data?.error) {
        const error = err.response.data.error;
        if (error.message) {
          errorMsg = error.message;
          // If there are validation details, append them
          if (error.details) {
            const detailMessages = Object.entries(error.details)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            errorMsg += ` - ${detailMessages}`;
          }
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
      }

      setAdjudicationError(errorMsg);
    } finally {
      setAdjudicating(false);
    }
  };

  const isPayer = user?.role === 'payer_processor';
  const canAdjudicate = isPayer && claim?.status?.toLowerCase() === 'submitted';

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

        {/* AI Priority Categorization */}
        {claim.priority && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Priority Categorization
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Priority Level</p>
                <PriorityBadge
                  priority={claim.priority}
                  confidence={claim.priorityConfidence}
                  showConfidence={true}
                  size="lg"
                />
              </div>
              {claim.priorityConfidence !== null && claim.priorityConfidence !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Confidence</p>
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          claim.priorityConfidence >= 0.9 ? 'bg-blue-600' :
                          claim.priorityConfidence >= 0.7 ? 'bg-blue-400' :
                          'bg-orange-400'
                        }`}
                        style={{ width: `${claim.priorityConfidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {Math.round(claim.priorityConfidence * 100)}%
                    </span>
                  </div>
                </div>
              )}
              {claim.priorityReasoning && (
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Reasoning</p>
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-900 italic">{claim.priorityReasoning}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adjudication Actions - Only show for payers on submitted claims */}
        {canAdjudicate && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjudication Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve Claim
              </button>
              <button
                onClick={handleDeny}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deny Claim
              </button>
            </div>
          </div>
        )}

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

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Approve Claim</h3>
                {adjudicationError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {adjudicationError}
                  </div>
                )}
                <form onSubmit={submitApproval}>
                  <div className="mb-4">
                    <label htmlFor="approvedAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Approved Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                      <input
                        type="number"
                        id="approvedAmount"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        step="0.01"
                        min="0"
                        max={claim.service?.billedAmount}
                        required
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Billed amount: {formatCurrency(claim.service?.billedAmount)}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="adjudicationNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="adjudicationNotes"
                      value={adjudicationNotes}
                      onChange={(e) => setAdjudicationNotes(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add any notes about this approval..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={adjudicating}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {adjudicating ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApproveModal(false)}
                      disabled={adjudicating}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Deny Modal */}
        {showDenyModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Deny Claim</h3>
                {adjudicationError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {adjudicationError}
                  </div>
                )}
                <form onSubmit={submitDenial}>
                  <div className="mb-4">
                    <label htmlFor="denialReasonCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Denial Reason Code *
                    </label>
                    <select
                      id="denialReasonCode"
                      value={denialReasonCode}
                      onChange={(e) => setDenialReasonCode(e.target.value)}
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select a reason...</option>
                      <option value="INVALID_CPT">Invalid CPT Code</option>
                      <option value="INVALID_DIAGNOSIS">Invalid Diagnosis Code</option>
                      <option value="NOT_COVERED">Service Not Covered</option>
                      <option value="PATIENT_INELIGIBLE">Patient Ineligible</option>
                      <option value="DUPLICATE_CLAIM">Duplicate Claim</option>
                      <option value="INSUFFICIENT_DOCS">Insufficient Documentation</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="denialExplanation" className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation * (minimum 20 characters)
                    </label>
                    <textarea
                      id="denialExplanation"
                      value={denialExplanation}
                      onChange={(e) => setDenialExplanation(e.target.value)}
                      rows={3}
                      required
                      minLength={20}
                      maxLength={1000}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Provide a detailed explanation for the denial (at least 20 characters)..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {denialExplanation.length}/1000 characters
                      {denialExplanation.length > 0 && denialExplanation.length < 20 && (
                        <span className="text-red-600 ml-2">
                          (Need {20 - denialExplanation.length} more characters)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="adjudicationNotesdeny" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="adjudicationNotesdeny"
                      value={adjudicationNotes}
                      onChange={(e) => setAdjudicationNotes(e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={adjudicating}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {adjudicating ? 'Denying...' : 'Deny'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDenyModal(false)}
                      disabled={adjudicating}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimDetailPage;
