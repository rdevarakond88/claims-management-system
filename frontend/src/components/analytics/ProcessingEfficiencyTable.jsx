import React from 'react';

const ProcessingEfficiencyTable = ({ timeMetrics, approvalMetrics }) => {
  if (!timeMetrics || !approvalMetrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading efficiency data...</p>
      </div>
    );
  }

  const priorities = ['URGENT', 'STANDARD', 'ROUTINE'];

  const getStatusColor = (slaCompliance) => {
    if (slaCompliance >= 95) return 'text-green-600 bg-green-50';
    if (slaCompliance >= 85) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-300',
      STANDARD: 'bg-amber-100 text-amber-800 border-amber-300',
      ROUTINE: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing Efficiency by Priority
        </h3>
        <p className="text-sm text-gray-600">
          Comprehensive metrics for claim processing performance
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA Compliance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approval Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {priorities.map((priority) => {
              const timeData = timeMetrics[priority] || {};
              const approvalData = approvalMetrics.byPriority[priority] || {};
              const slaCompliance = timeData.slaCompliancePercent || 0;

              return (
                <tr key={priority} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(priority)}`}>
                      {priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{timeData.count || 0}</div>
                    <div className="text-xs text-gray-500">claims</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">
                      {timeData.averageHours
                        ? timeData.averageHours < 24
                          ? `${timeData.averageHours}h`
                          : `${timeData.averageDays}d`
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeData.averageHours && timeData.averageHours < 24
                        ? `${Math.round((timeData.averageHours / 24) * 10) / 10} days`
                        : timeData.averageHours
                        ? `${Math.round(timeData.averageHours)} hours`
                        : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {timeData.slaTargetHours
                      ? timeData.slaTargetHours < 24
                        ? `${timeData.slaTargetHours}h`
                        : `${timeData.slaTargetHours / 24}d`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(slaCompliance)}`}>
                      {slaCompliance > 0 ? (
                        <>
                          {slaCompliance}%
                          {slaCompliance >= 95 && (
                            <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{approvalData.approvalRate || 0}%</div>
                    <div className="text-xs text-gray-500">
                      {approvalData.approved || 0} / {(approvalData.approved || 0) + (approvalData.denied || 0)} approved
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {priorities.map((priority) => {
          const timeData = timeMetrics[priority] || {};
          const approvalData = approvalMetrics.byPriority[priority] || {};
          const slaCompliance = timeData.slaCompliancePercent || 0;

          return (
            <div key={priority} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(priority)}`}>
                  {priority}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Volume</p>
                  <p className="font-semibold text-gray-900">{timeData.count || 0} claims</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Avg Time</p>
                  <p className="font-semibold text-gray-900">
                    {timeData.averageHours
                      ? timeData.averageHours < 24
                        ? `${timeData.averageHours}h`
                        : `${timeData.averageDays}d`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">SLA Compliance</p>
                  <p className={`font-semibold ${slaCompliance >= 95 ? 'text-green-600' : slaCompliance >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                    {slaCompliance > 0 ? `${slaCompliance}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Approval Rate</p>
                  <p className="font-semibold text-gray-900">{approvalData.approvalRate || 0}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">SLA Targets & Performance Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="font-medium text-red-900 mb-1">URGENT Claims</p>
            <p className="text-gray-600">Target: &lt;24 hours</p>
            <p className="text-gray-600">Critical medical procedures</p>
          </div>
          <div>
            <p className="font-medium text-amber-900 mb-1">STANDARD Claims</p>
            <p className="text-gray-600">Target: &lt;72 hours (3 days)</p>
            <p className="text-gray-600">Routine medical procedures</p>
          </div>
          <div>
            <p className="font-medium text-green-900 mb-1">ROUTINE Claims</p>
            <p className="text-gray-600">Target: &lt;7 days</p>
            <p className="text-gray-600">Preventive care & wellness</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-300 flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-700">≥95% Excellent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-gray-700">85-94% Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-700">&lt;85% Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingEfficiencyTable;
