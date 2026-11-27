import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    revenueData: [],
    requestTrends: [],
    topMechanics: [],
    popularServices: [],
    summary: {
      totalRevenue: 0,
      totalUsers: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      revenueGrowth: 0,
      userGrowth: 0,
      requestGrowth: 0,
      responseTimeChange: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnalytics(period);

      if (response.success) {
        setAnalytics(
          response.data || {
            userGrowth: [],
            revenueData: [],
            requestTrends: [],
            topMechanics: [],
            popularServices: [],
            summary: {
              totalRevenue: 0,
              totalUsers: 0,
              totalRequests: 0,
              avgResponseTime: 0,
              revenueGrowth: 0,
              userGrowth: 0,
              requestGrowth: 0,
              responseTimeChange: 0,
            },
          },
        );
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
      setAnalytics({
        userGrowth: [],
        revenueData: [],
        requestTrends: [],
        topMechanics: [],
        popularServices: [],
        summary: {
          totalRevenue: 0,
          totalUsers: 0,
          totalRequests: 0,
          avgResponseTime: 0,
          revenueGrowth: 0,
          userGrowth: 0,
          requestGrowth: 0,
          responseTimeChange: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getGrowthIcon = (percentage) => {
    const num = parseFloat(percentage || 0);
    if (num > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-success-700" />;
    } else if (num < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-danger-700" />;
    }
    return <ChartBarIcon className="h-4 w-4 text-secondary-500" />;
  };

  const getGrowthColor = (percentage) => {
    const num = parseFloat(percentage || 0);
    if (num > 0) return 'text-success-700';
    if (num < 0) return 'text-danger-700';
    return 'text-secondary-600';
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Analytics dashboard</h1>
          <p className="text-sm text-secondary-600">Monitor key metrics and performance indicators</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-36">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          <Button variant="secondary" onClick={fetchAnalytics} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(analytics.summary?.totalRevenue || 0),
            delta: `${analytics.summary?.revenueGrowth || 0}% from last period`,
            icon: CurrencyDollarIcon,
            tone: 'bg-primary-100 text-primary-900',
            deltaTone: getGrowthColor(analytics.summary?.revenueGrowth),
            deltaIcon: getGrowthIcon(analytics.summary?.revenueGrowth),
          },
          {
            label: 'Total Users',
            value: (analytics.summary?.totalUsers || 0).toLocaleString(),
            delta: `${analytics.summary?.userGrowth || 0}% from last period`,
            icon: UsersIcon,
            tone: 'bg-success-50 text-success-700',
            deltaTone: getGrowthColor(analytics.summary?.userGrowth),
            deltaIcon: getGrowthIcon(analytics.summary?.userGrowth),
          },
          {
            label: 'Total Requests',
            value: (analytics.summary?.totalRequests || 0).toLocaleString(),
            delta: `${analytics.summary?.requestGrowth || 0}% from last period`,
            icon: WrenchScrewdriverIcon,
            tone: 'bg-warning-50 text-warning-700',
            deltaTone: getGrowthColor(analytics.summary?.requestGrowth),
            deltaIcon: getGrowthIcon(analytics.summary?.requestGrowth),
          },
          {
            label: 'Avg Response Time',
            value: `${analytics.summary?.avgResponseTime || 0} min`,
            delta: `${analytics.summary?.responseTimeChange || 0}% from last period`,
            icon: ClockIcon,
            tone: 'bg-surface text-primary-900',
            deltaTone: getGrowthColor(analytics.summary?.responseTimeChange),
            deltaIcon: getGrowthIcon(analytics.summary?.responseTimeChange),
          },
        ].map(({ label, value, delta, icon: Icon, tone, deltaTone, deltaIcon }) => (
          <div key={label} className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-700">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  {deltaIcon}
                  <span className={deltaTone}>{delta}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <h3 className="text-lg font-medium text-ink">Service distribution</h3>
          {analytics.popularServices && analytics.popularServices.length > 0 ? (
            <div className="mt-4 space-y-4">
              {analytics.popularServices.slice(0, 5).map((service, index) => {
                const percentage = service.percentage || 0;
                return (
                  <div key={service._id || index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-secondary-700">
                        {service._id?.replace('_', ' ').toUpperCase() || 'Unknown'}
                      </span>
                      <span className="text-secondary-500">{service.count || 0} requests</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary-900" style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-secondary-500">
              <ChartBarIcon className="mx-auto mb-2 h-10 w-10 text-secondary-400" />
              No service data available
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <h3 className="text-lg font-medium text-ink">Operational snapshot</h3>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Average response time', value: `${analytics.summary?.avgResponseTime || 0} mins` },
              { label: 'Platform alerts', value: analytics.pendingVerifications ? `${analytics.pendingVerifications} pending` : 'All clear' },
              { label: 'Growers', value: `${analytics.summary?.userGrowth || 0}% user growth` },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3">
                <span className="text-sm text-secondary-600">{stat.label}</span>
                <span className="text-sm font-medium text-ink">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
