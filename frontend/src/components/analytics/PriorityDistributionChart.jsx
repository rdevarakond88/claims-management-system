import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PriorityDistributionChart = ({ priorityData }) => {
  if (!priorityData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading priority data...</p>
      </div>
    );
  }

  const { total, byPriority } = priorityData;

  // Prepare data for the pie chart
  const chartData = [
    {
      name: 'URGENT',
      value: byPriority.URGENT?.count || 0,
      percentage: byPriority.URGENT?.percentage || 0,
      color: '#EF4444',
    },
    {
      name: 'STANDARD',
      value: byPriority.STANDARD?.count || 0,
      percentage: byPriority.STANDARD?.percentage || 0,
      color: '#F59E0B',
    },
    {
      name: 'ROUTINE',
      value: byPriority.ROUTINE?.count || 0,
      percentage: byPriority.ROUTINE?.percentage || 0,
      color: '#10B981',
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm text-gray-700">
            Count: {data.value} claims
          </p>
          <p className="text-sm text-gray-700">
            Percentage: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 5) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Priority Distribution
        </h3>
        <p className="text-sm text-gray-600">
          Claims breakdown by AI-assigned priority level
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between">
        {/* Pie Chart */}
        <div className="w-full md:w-1/2">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="w-full md:w-1/2 mt-6 md:mt-0 space-y-4">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-3"></div>
              <span className="font-medium text-gray-900">URGENT</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">
                {byPriority.URGENT?.count || 0}
              </p>
              <p className="text-xs text-gray-600">
                {byPriority.URGENT?.percentage || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-amber-500 mr-3"></div>
              <span className="font-medium text-gray-900">STANDARD</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600">
                {byPriority.STANDARD?.count || 0}
              </p>
              <p className="text-xs text-gray-600">
                {byPriority.STANDARD?.percentage || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
              <span className="font-medium text-gray-900">ROUTINE</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {byPriority.ROUTINE?.count || 0}
              </p>
              <p className="text-xs text-gray-600">
                {byPriority.ROUTINE?.percentage || 0}%
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Claims</span>
              <span className="text-xl font-bold text-gray-900">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityDistributionChart;
