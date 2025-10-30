import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ComparisonChart = ({ comparisonData }) => {
  if (!comparisonData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading comparison data...</p>
      </div>
    );
  }

  const { withAI, withoutAI, improvement } = comparisonData;

  // Prepare data for the chart
  const chartData = [
    {
      name: 'With AI',
      urgent: withAI.urgent.averageHours,
      standard: withAI.standard.averageHours,
      routine: withAI.routine.averageHours,
    },
    {
      name: 'Without AI*',
      urgent: withoutAI.urgent.averageHours,
      standard: withoutAI.standard.averageHours,
      routine: withoutAI.routine.averageHours,
    },
  ];

  const colors = {
    urgent: '#EF4444', // Red
    standard: '#F59E0B', // Amber
    routine: '#10B981', // Green
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI Impact: Time to Adjudication Comparison
        </h3>
        <p className="text-sm text-gray-600">
          Average processing time in hours - With AI vs Without AI (FIFO)
        </p>
      </div>

      {/* Key Metrics Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900 mb-2">URGENT Claims</p>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">
                {withAI.urgent.averageHours}h
              </p>
              <p className="text-xs text-red-700">With AI</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-red-400">
                {withoutAI.urgent.averageHours}h
              </p>
              <p className="text-xs text-red-600">Without AI</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-sm font-bold text-green-600">
              ↓ {improvement.urgent.timeSavedPercent}% faster
            </p>
            <p className="text-xs text-gray-600">
              Saves {improvement.urgent.timeSavedHours} hours on average
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900 mb-2">STANDARD Claims</p>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {withAI.standard.averageHours}h
              </p>
              <p className="text-xs text-amber-700">With AI</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-amber-400">
                {withoutAI.standard.averageHours}h
              </p>
              <p className="text-xs text-amber-600">Without AI</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-sm font-bold text-green-600">
              ↓ {improvement.standard.timeSavedPercent}% faster
            </p>
            <p className="text-xs text-gray-600">
              Saves {improvement.standard.timeSavedHours} hours on average
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900 mb-2">ROUTINE Claims</p>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {withAI.routine.averageHours}h
              </p>
              <p className="text-xs text-green-700">With AI</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-green-400">
                {withoutAI.routine.averageHours}h
              </p>
              <p className="text-xs text-green-600">Without AI</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-sm text-gray-600">Consistently efficient</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value) => `${value} hours`}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
            />
            <Legend />
            <Bar dataKey="urgent" name="Urgent" fill={colors.urgent} />
            <Bar dataKey="standard" name="Standard" fill={colors.standard} />
            <Bar dataKey="routine" name="Routine" fill={colors.routine} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          * Without AI metrics are simulated based on FIFO (First In, First Out) processing assumptions.
          With AI prioritization, urgent claims are processed immediately, resulting in significant time savings.
        </p>
      </div>
    </div>
  );
};

export default ComparisonChart;
