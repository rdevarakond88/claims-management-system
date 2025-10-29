import React from 'react';
import PropTypes from 'prop-types';

/**
 * PriorityBadge Component
 * Displays a color-coded badge for claim priority with optional confidence indicator
 *
 * @param {string} priority - Priority level: 'URGENT', 'STANDARD', or 'ROUTINE'
 * @param {number} confidence - Optional AI confidence score (0-1)
 * @param {boolean} showConfidence - Whether to show confidence indicator
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 */
const PriorityBadge = ({
  priority,
  confidence = null,
  showConfidence = false,
  size = 'md'
}) => {
  // Normalize priority to uppercase
  const normalizedPriority = priority?.toUpperCase();

  // Priority configurations
  const priorityConfig = {
    URGENT: {
      label: 'Urgent',
      icon: '🔴',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      dotColor: 'bg-red-500'
    },
    STANDARD: {
      label: 'Standard',
      icon: '🟡',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
      dotColor: 'bg-yellow-500'
    },
    ROUTINE: {
      label: 'Routine',
      icon: '🟢',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      dotColor: 'bg-green-500'
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      dot: 'w-1.5 h-1.5',
      confidence: 'text-[10px]'
    },
    md: {
      badge: 'px-2.5 py-1 text-sm',
      dot: 'w-2 h-2',
      confidence: 'text-xs'
    },
    lg: {
      badge: 'px-3 py-1.5 text-base',
      dot: 'w-2.5 h-2.5',
      confidence: 'text-sm'
    }
  };

  const config = priorityConfig[normalizedPriority] || priorityConfig.STANDARD;
  const sizeClasses = sizeConfig[size] || sizeConfig.md;

  // Format confidence as percentage
  const confidencePercentage = confidence !== null && confidence !== undefined
    ? Math.round(confidence * 100)
    : null;

  // Determine confidence level (high, medium, low)
  const getConfidenceLevel = (conf) => {
    if (conf === null || conf === undefined) return null;
    if (conf >= 0.9) return 'high';
    if (conf >= 0.7) return 'medium';
    return 'low';
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-full border
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${sizeClasses.badge}
        `}
        title={`Priority: ${config.label}${confidencePercentage ? ` (${confidencePercentage}% confidence)` : ''}`}
      >
        {/* Priority dot */}
        <span
          className={`rounded-full ${config.dotColor} ${sizeClasses.dot}`}
          aria-hidden="true"
        />

        {/* Priority label */}
        <span>{config.label}</span>
      </span>

      {/* Confidence indicator (optional) */}
      {showConfidence && confidencePercentage !== null && (
        <span
          className={`
            inline-flex items-center px-1.5 py-0.5 rounded font-medium
            ${confidenceLevel === 'high' ? 'bg-blue-100 text-blue-800' : ''}
            ${confidenceLevel === 'medium' ? 'bg-gray-100 text-gray-700' : ''}
            ${confidenceLevel === 'low' ? 'bg-orange-100 text-orange-700' : ''}
            ${sizeClasses.confidence}
          `}
          title={`AI Confidence: ${confidencePercentage}%`}
        >
          {confidencePercentage}%
        </span>
      )}
    </span>
  );
};

PriorityBadge.propTypes = {
  priority: PropTypes.oneOf(['URGENT', 'STANDARD', 'ROUTINE', 'urgent', 'standard', 'routine']).isRequired,
  confidence: PropTypes.number,
  showConfidence: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default PriorityBadge;
