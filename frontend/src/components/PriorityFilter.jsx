import React from 'react';
import PropTypes from 'prop-types';

/**
 * PriorityFilter Component
 * Provides a filter UI for selecting claim priorities
 *
 * @param {string} selectedPriority - Currently selected priority ('all', 'urgent', 'standard', 'routine')
 * @param {function} onPriorityChange - Callback when priority selection changes
 * @param {boolean} disabled - Whether the filter is disabled
 * @param {string} className - Additional CSS classes
 */
const PriorityFilter = ({
  selectedPriority = 'all',
  onPriorityChange,
  disabled = false,
  className = ''
}) => {
  const priorities = [
    {
      value: 'all',
      label: 'All Priorities',
      icon: '🔵',
      color: 'text-gray-700'
    },
    {
      value: 'urgent',
      label: 'Urgent',
      icon: '🔴',
      color: 'text-red-600'
    },
    {
      value: 'standard',
      label: 'Standard',
      icon: '🟡',
      color: 'text-yellow-600'
    },
    {
      value: 'routine',
      label: 'Routine',
      icon: '🟢',
      color: 'text-green-600'
    }
  ];

  const handleChange = (e) => {
    if (onPriorityChange) {
      onPriorityChange(e.target.value);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label
        htmlFor="priority-filter"
        className="text-sm font-medium text-gray-700"
      >
        Priority:
      </label>

      <div className="relative">
        <select
          id="priority-filter"
          value={selectedPriority}
          onChange={handleChange}
          disabled={disabled}
          className={`
            appearance-none rounded-md border border-gray-300 bg-white
            px-3 py-2 pr-10 text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {priorities.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>

        {/* Dropdown icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Selected priority indicator */}
      {selectedPriority !== 'all' && (
        <span className="text-xs text-gray-500">
          (Filtering active)
        </span>
      )}
    </div>
  );
};

PriorityFilter.propTypes = {
  selectedPriority: PropTypes.oneOf(['all', 'urgent', 'standard', 'routine']),
  onPriorityChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default PriorityFilter;
