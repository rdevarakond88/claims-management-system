const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  /**
   * Get comprehensive analytics overview for the dashboard
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis period
   * @param {Date} options.endDate - End date for analysis period
   * @returns {Object} Analytics data
   */
  async getOverview(options = {}) {
    const { startDate, endDate } = this._getDateRange(options);

    const [
      totalClaims,
      priorityDistribution,
      timeMetrics,
      approvalMetrics,
      aiConfidenceMetrics,
      financialMetrics,
    ] = await Promise.all([
      this._getTotalClaims(startDate, endDate),
      this._getPriorityDistribution(startDate, endDate),
      this._getTimeToAdjudicationMetrics(startDate, endDate),
      this._getApprovalMetrics(startDate, endDate),
      this._getAIConfidenceMetrics(startDate, endDate),
      this._getFinancialMetrics(startDate, endDate),
    ]);

    // Calculate with vs without AI comparison
    const comparisonMetrics = this._calculateAIComparison(timeMetrics, priorityDistribution);

    return {
      period: {
        startDate,
        endDate,
        days: this._calculateDaysBetween(startDate, endDate),
      },
      overview: {
        totalClaims,
        ...priorityDistribution,
      },
      timeMetrics,
      approvalMetrics,
      aiConfidenceMetrics,
      financialMetrics,
      comparisonMetrics,
    };
  }

  /**
   * Get time to adjudication metrics by priority
   */
  async _getTimeToAdjudicationMetrics(startDate, endDate) {
    const claims = await prisma.claim.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
        adjudicatedAt: { not: null },
        status: { in: ['approved', 'denied'] },
      },
      select: {
        priority: true,
        submittedAt: true,
        adjudicatedAt: true,
        status: true,
      },
    });

    // Group by priority and calculate average time
    const metricsByPriority = {
      URGENT: { times: [], count: 0, slaTarget: 24 }, // 24 hours
      STANDARD: { times: [], count: 0, slaTarget: 72 }, // 72 hours (3 days)
      ROUTINE: { times: [], count: 0, slaTarget: 168 }, // 168 hours (7 days)
    };

    claims.forEach((claim) => {
      const timeInHours = this._calculateHoursBetween(
        claim.submittedAt,
        claim.adjudicatedAt
      );
      metricsByPriority[claim.priority].times.push(timeInHours);
      metricsByPriority[claim.priority].count++;
    });

    // Calculate averages and SLA compliance
    const result = {};
    for (const [priority, data] of Object.entries(metricsByPriority)) {
      const avgTimeHours =
        data.times.length > 0
          ? data.times.reduce((sum, time) => sum + time, 0) / data.times.length
          : 0;

      const slaCompliance =
        data.times.length > 0
          ? (data.times.filter((time) => time <= data.slaTarget).length / data.times.length) * 100
          : 0;

      result[priority] = {
        count: data.count,
        averageHours: Math.round(avgTimeHours * 10) / 10,
        averageDays: Math.round((avgTimeHours / 24) * 10) / 10,
        slaTargetHours: data.slaTarget,
        slaCompliancePercent: Math.round(slaCompliance * 10) / 10,
        minHours: data.times.length > 0 ? Math.min(...data.times) : 0,
        maxHours: data.times.length > 0 ? Math.max(...data.times) : 0,
      };
    }

    return result;
  }

  /**
   * Get priority distribution statistics
   */
  async _getPriorityDistribution(startDate, endDate) {
    const distribution = await prisma.claim.groupBy({
      by: ['priority'],
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const total = distribution.reduce((sum, item) => sum + item._count, 0);

    const result = {
      total,
      byPriority: {},
    };

    distribution.forEach((item) => {
      result.byPriority[item.priority] = {
        count: item._count,
        percentage: total > 0 ? Math.round((item._count / total) * 100 * 10) / 10 : 0,
      };
    });

    // Ensure all priorities are present even if count is 0
    ['URGENT', 'STANDARD', 'ROUTINE'].forEach((priority) => {
      if (!result.byPriority[priority]) {
        result.byPriority[priority] = { count: 0, percentage: 0 };
      }
    });

    return result;
  }

  /**
   * Get approval/denial rate metrics
   */
  async _getApprovalMetrics(startDate, endDate) {
    const claims = await prisma.claim.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['approved', 'denied'] },
      },
      select: {
        priority: true,
        status: true,
        billedAmount: true,
        approvedAmount: true,
      },
    });

    const metricsByPriority = {
      URGENT: { approved: 0, denied: 0, totalBilled: 0, totalApproved: 0 },
      STANDARD: { approved: 0, denied: 0, totalBilled: 0, totalApproved: 0 },
      ROUTINE: { approved: 0, denied: 0, totalBilled: 0, totalApproved: 0 },
    };

    let overallApproved = 0;
    let overallDenied = 0;
    let overallTotalBilled = 0;
    let overallTotalApproved = 0;

    claims.forEach((claim) => {
      const priority = claim.priority;
      metricsByPriority[priority].totalBilled += parseFloat(claim.billedAmount);

      if (claim.status === 'approved') {
        metricsByPriority[priority].approved++;
        metricsByPriority[priority].totalApproved += parseFloat(claim.approvedAmount || 0);
        overallApproved++;
        overallTotalApproved += parseFloat(claim.approvedAmount || 0);
      } else {
        metricsByPriority[priority].denied++;
        overallDenied++;
      }
      overallTotalBilled += parseFloat(claim.billedAmount);
    });

    const result = {
      overall: {
        approvalRate:
          overallApproved + overallDenied > 0
            ? Math.round((overallApproved / (overallApproved + overallDenied)) * 100 * 10) / 10
            : 0,
        approved: overallApproved,
        denied: overallDenied,
        totalBilled: Math.round(overallTotalBilled * 100) / 100,
        totalApproved: Math.round(overallTotalApproved * 100) / 100,
      },
      byPriority: {},
    };

    for (const [priority, data] of Object.entries(metricsByPriority)) {
      const total = data.approved + data.denied;
      result.byPriority[priority] = {
        approvalRate: total > 0 ? Math.round((data.approved / total) * 100 * 10) / 10 : 0,
        approved: data.approved,
        denied: data.denied,
        totalBilled: Math.round(data.totalBilled * 100) / 100,
        totalApproved: Math.round(data.totalApproved * 100) / 100,
        averageApprovedAmount:
          data.approved > 0 ? Math.round((data.totalApproved / data.approved) * 100) / 100 : 0,
      };
    }

    return result;
  }

  /**
   * Get AI confidence metrics
   */
  async _getAIConfidenceMetrics(startDate, endDate) {
    const claims = await prisma.claim.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
        priorityConfidence: { not: null },
      },
      select: {
        priority: true,
        priorityConfidence: true,
      },
    });

    const metricsByPriority = {
      URGENT: { confidences: [], count: 0 },
      STANDARD: { confidences: [], count: 0 },
      ROUTINE: { confidences: [], count: 0 },
    };

    const allConfidences = [];

    claims.forEach((claim) => {
      const confidence = parseFloat(claim.priorityConfidence);
      metricsByPriority[claim.priority].confidences.push(confidence);
      metricsByPriority[claim.priority].count++;
      allConfidences.push(confidence);
    });

    // Calculate confidence distribution
    const confidenceRanges = {
      high: allConfidences.filter((c) => c >= 0.9).length, // >= 90%
      medium: allConfidences.filter((c) => c >= 0.7 && c < 0.9).length, // 70-89%
      low: allConfidences.filter((c) => c < 0.7).length, // < 70%
    };

    const result = {
      overall: {
        average:
          allConfidences.length > 0
            ? Math.round(
                (allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length) * 100 * 10
              ) / 10
            : 0,
        min:
          allConfidences.length > 0
            ? Math.round(Math.min(...allConfidences) * 100 * 10) / 10
            : 0,
        max:
          allConfidences.length > 0
            ? Math.round(Math.max(...allConfidences) * 100 * 10) / 10
            : 0,
        distribution: {
          high: confidenceRanges.high,
          highPercent:
            allConfidences.length > 0
              ? Math.round((confidenceRanges.high / allConfidences.length) * 100 * 10) / 10
              : 0,
          medium: confidenceRanges.medium,
          mediumPercent:
            allConfidences.length > 0
              ? Math.round((confidenceRanges.medium / allConfidences.length) * 100 * 10) / 10
              : 0,
          low: confidenceRanges.low,
          lowPercent:
            allConfidences.length > 0
              ? Math.round((confidenceRanges.low / allConfidences.length) * 100 * 10) / 10
              : 0,
        },
      },
      byPriority: {},
    };

    for (const [priority, data] of Object.entries(metricsByPriority)) {
      result.byPriority[priority] = {
        average:
          data.confidences.length > 0
            ? Math.round(
                (data.confidences.reduce((sum, c) => sum + c, 0) / data.confidences.length) *
                  100 *
                  10
              ) / 10
            : 0,
        count: data.count,
      };
    }

    return result;
  }

  /**
   * Get financial metrics by priority
   */
  async _getFinancialMetrics(startDate, endDate) {
    const claims = await prisma.claim.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        priority: true,
        billedAmount: true,
        approvedAmount: true,
        status: true,
      },
    });

    const metricsByPriority = {
      URGENT: { claims: [], totalBilled: 0, totalApproved: 0, count: 0 },
      STANDARD: { claims: [], totalBilled: 0, totalApproved: 0, count: 0 },
      ROUTINE: { claims: [], totalBilled: 0, totalApproved: 0, count: 0 },
    };

    claims.forEach((claim) => {
      const billed = parseFloat(claim.billedAmount);
      const approved = parseFloat(claim.approvedAmount || 0);

      metricsByPriority[claim.priority].claims.push(billed);
      metricsByPriority[claim.priority].totalBilled += billed;
      metricsByPriority[claim.priority].totalApproved += approved;
      metricsByPriority[claim.priority].count++;
    });

    const result = {
      byPriority: {},
    };

    let grandTotalBilled = 0;
    let grandTotalApproved = 0;

    for (const [priority, data] of Object.entries(metricsByPriority)) {
      result.byPriority[priority] = {
        totalBilled: Math.round(data.totalBilled * 100) / 100,
        totalApproved: Math.round(data.totalApproved * 100) / 100,
        averageBilled:
          data.count > 0 ? Math.round((data.totalBilled / data.count) * 100) / 100 : 0,
        count: data.count,
        percentOfTotalValue: 0, // Will calculate after totals
      };

      grandTotalBilled += data.totalBilled;
      grandTotalApproved += data.totalApproved;
    }

    // Calculate percentage of total value
    for (const priority of Object.keys(result.byPriority)) {
      result.byPriority[priority].percentOfTotalValue =
        grandTotalBilled > 0
          ? Math.round(
              (result.byPriority[priority].totalBilled / grandTotalBilled) * 100 * 10
            ) / 10
          : 0;
    }

    result.overall = {
      totalBilled: Math.round(grandTotalBilled * 100) / 100,
      totalApproved: Math.round(grandTotalApproved * 100) / 100,
    };

    return result;
  }

  /**
   * Calculate with vs without AI comparison
   * Simulates FIFO processing vs AI-prioritized processing
   */
  _calculateAIComparison(timeMetrics, priorityDistribution) {
    // With AI: Use actual metrics
    const withAI = {
      urgent: {
        averageHours: timeMetrics.URGENT?.averageHours || 0,
        slaCompliance: timeMetrics.URGENT?.slaCompliancePercent || 0,
        count: timeMetrics.URGENT?.count || 0,
      },
      standard: {
        averageHours: timeMetrics.STANDARD?.averageHours || 0,
        slaCompliance: timeMetrics.STANDARD?.slaCompliancePercent || 0,
        count: timeMetrics.STANDARD?.count || 0,
      },
      routine: {
        averageHours: timeMetrics.ROUTINE?.averageHours || 0,
        slaCompliance: timeMetrics.ROUTINE?.slaCompliancePercent || 0,
        count: timeMetrics.ROUTINE?.count || 0,
      },
    };

    // Without AI: Simulate FIFO processing
    // Assumption: All claims processed in order of submission
    // Average time would be weighted by volume, no prioritization
    const totalAdjudicated =
      (timeMetrics.URGENT?.count || 0) +
      (timeMetrics.STANDARD?.count || 0) +
      (timeMetrics.ROUTINE?.count || 0);

    // Calculate weighted average (what all claims would experience in FIFO)
    const weightedAverage =
      totalAdjudicated > 0
        ? ((timeMetrics.URGENT?.averageHours || 0) * (timeMetrics.URGENT?.count || 0) +
            (timeMetrics.STANDARD?.averageHours || 0) * (timeMetrics.STANDARD?.count || 0) +
            (timeMetrics.ROUTINE?.averageHours || 0) * (timeMetrics.ROUTINE?.count || 0)) /
          totalAdjudicated
        : 0;

    // Without AI, urgent claims would wait in FIFO queue
    // Simulated as: they'd experience the weighted average time
    // Plus additional delay based on their position in queue (conservative estimate: 1.5x)
    const withoutAI = {
      urgent: {
        averageHours: Math.round(weightedAverage * 1.5 * 10) / 10, // 50% longer due to no prioritization
        slaCompliance: Math.max(0, (timeMetrics.URGENT?.slaCompliancePercent || 0) - 35), // Significant SLA misses
        count: timeMetrics.URGENT?.count || 0,
      },
      standard: {
        averageHours: Math.round(weightedAverage * 1.1 * 10) / 10, // Slightly longer
        slaCompliance: Math.max(0, (timeMetrics.STANDARD?.slaCompliancePercent || 0) - 15),
        count: timeMetrics.STANDARD?.count || 0,
      },
      routine: {
        averageHours: Math.round(weightedAverage * 0.9 * 10) / 10, // Slightly faster (benefit from no urgent queue jumping)
        slaCompliance: Math.min(100, (timeMetrics.ROUTINE?.slaCompliancePercent || 0) + 5),
        count: timeMetrics.ROUTINE?.count || 0,
      },
    };

    // Calculate improvement percentages
    const improvement = {
      urgent: {
        timeSavedHours:
          Math.round((withoutAI.urgent.averageHours - withAI.urgent.averageHours) * 10) / 10,
        timeSavedPercent:
          withoutAI.urgent.averageHours > 0
            ? Math.round(
                ((withoutAI.urgent.averageHours - withAI.urgent.averageHours) /
                  withoutAI.urgent.averageHours) *
                  100 *
                  10
              ) / 10
            : 0,
        slaImprovement: withAI.urgent.slaCompliance - withoutAI.urgent.slaCompliance,
      },
      standard: {
        timeSavedHours:
          Math.round((withoutAI.standard.averageHours - withAI.standard.averageHours) * 10) / 10,
        timeSavedPercent:
          withoutAI.standard.averageHours > 0
            ? Math.round(
                ((withoutAI.standard.averageHours - withAI.standard.averageHours) /
                  withoutAI.standard.averageHours) *
                  100 *
                  10
              ) / 10
            : 0,
        slaImprovement: withAI.standard.slaCompliance - withoutAI.standard.slaCompliance,
      },
    };

    return {
      withAI,
      withoutAI,
      improvement,
      note: 'Without AI metrics are simulated based on FIFO processing assumptions',
    };
  }

  /**
   * Get total claims count
   */
  async _getTotalClaims(startDate, endDate) {
    return await prisma.claim.count({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get date range for queries
   */
  _getDateRange(options) {
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    return { startDate, endDate };
  }

  /**
   * Calculate hours between two dates
   */
  _calculateHoursBetween(startDate, endDate) {
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Calculate days between two dates
   */
  _calculateDaysBetween(startDate, endDate) {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get trend data over time (daily aggregation)
   */
  async getTrendData(options = {}) {
    const { startDate, endDate } = this._getDateRange(options);

    const claims = await prisma.claim.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        priority: true,
        submittedAt: true,
        status: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    // Group by date and priority
    const trendMap = new Map();

    claims.forEach((claim) => {
      const dateKey = claim.submittedAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: dateKey,
          URGENT: 0,
          STANDARD: 0,
          ROUTINE: 0,
          total: 0,
        });
      }

      const dayData = trendMap.get(dateKey);
      dayData[claim.priority]++;
      dayData.total++;
    });

    // Convert to array and sort by date
    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = new AnalyticsService();
