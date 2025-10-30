import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const AIConfidenceMetrics = ({ confidenceData }) => {
  if (!confidenceData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading confidence data...</p>
      </div>
    );
  }

  const { overall, byPriority } = confidenceData;

  // Prepare data for confidence by priority chart
  const priorityConfidenceData = [
    {
      priority: 'URGENT',
      confidence: byPriority.URGENT?.average || 0,
      color: '#EF4444',
    },
    {
      priority: 'STANDARD',
      confidence: byPriority.STANDARD?.average || 0,
      color: '#F59E0B',
    },
    {
      priority: 'ROUTINE',
      confidence: byPriority.ROUTINE?.average || 0,
      color: '#10B981',
    },
  ];

  // Prepare data for confidence distribution chart
  const distributionData = [
    {
      range: 'High (≥90%)',
      count: overall.distribution.high,
      percentage: overall.distribution.highPercent,
      color: '#10B981',
    },
    {
      range: 'Medium (70-89%)',
      count: overall.distribution.medium,
      percentage: overall.distribution.mediumPercent,
      color: '#F59E0B',
    },
    {
      range: 'Low (<70%)',
      count: overall.distribution.low,
      percentage: overall.distribution.lowPercent,
      color: '#EF4444',
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.range || payload[0].payload.priority}</p>
          <p className="text-sm text-gray-700">
            {payload[0].payload.confidence
              ? `Confidence: ${payload[0].value}%`
              : `Count: ${payload[0].value} claims`
            }
          </p>
          {payload[0].payload.percentage !== undefined && (
            <p className="text-sm text-gray-700">
              Percentage: {payload[0].payload.percentage}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI Confidence & Accuracy
        </h3>
        <p className="text-sm text-gray-600">
          Confidence scores for AI-powered priority categorization
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1">Overall Average</p>
          <p className="text-3xl font-bold text-blue-600">{overall.average}%</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-green-900 mb-1">High Confidence</p>
          <p className="text-2xl font-bold text-green-600">{overall.distribution.high}</p>
          <p className="text-xs text-gray-600">{overall.distribution.highPercent}% of claims</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm font-medium text-amber-900 mb-1">Medium Confidence</p>
          <p className="text-2xl font-bold text-amber-600">{overall.distribution.medium}</p>
          <p className="text-xs text-gray-600">{overall.distribution.mediumPercent}% of claims</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm font-medium text-red-900 mb-1">Low Confidence</p>
          <p className="text-2xl font-bold text-red-600">{overall.distribution.low}</p>
          <p className="text-xs text-gray-600">{overall.distribution.lowPercent}% of claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence by Priority */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            Average Confidence by Priority
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityConfidenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis domain={[0, 100]} label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="confidence" name="Confidence %">
                {priorityConfidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {priorityConfidenceData.map((item) => (
              <div key={item.priority} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-gray-700">{item.priority}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            Confidence Distribution
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distributionData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: 'Number of Claims', position: 'insideBottom', offset: -5 }} />
              <YAxis type="category" dataKey="range" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Claims">
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {distributionData.map((item) => (
              <div key={item.range} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-gray-700">{item.range}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{item.count}</span>
                  <span className="text-gray-600 ml-2">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">About AI Confidence Scores</p>
            <p className="text-xs text-blue-800">
              Confidence scores indicate how certain the AI is about its priority assignment. High confidence (≥90%)
              typically indicates clear emergency indicators (e.g., CPT codes for emergency services, high-cost procedures).
              Lower confidence may suggest edge cases requiring human review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfidenceMetrics;
