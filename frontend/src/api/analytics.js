import api from './client';

/**
 * Get comprehensive analytics overview
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (ISO string)
 * @param {string} params.endDate - End date (ISO string)
 * @returns {Promise} Analytics data
 */
export const getAnalyticsOverview = async (params = {}) => {
  const response = await api.get('/analytics/overview', { params });
  return response.data;
};

/**
 * Get trend data over time
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (ISO string)
 * @param {string} params.endDate - End date (ISO string)
 * @returns {Promise} Trend data
 */
export const getAnalyticsTrends = async (params = {}) => {
  const response = await api.get('/analytics/trends', { params });
  return response.data;
};
