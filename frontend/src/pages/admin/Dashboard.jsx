import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
    serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
    payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
    reviews: { totalReviews: 0, averageRating: 0 },
    topMechanics: [],
    pendingVerifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      let dashboardResponse;
      try {
        dashboardResponse = await adminService.getDashboardStats();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        dashboardResponse = { success: false, data: {} };
      }

      let verificationsResponse;
      try {
        verificationsResponse = await adminService.getVerifications({ status: 'pending' });
      } catch (error) {
        console.error('Error fetching verifications:', error);
        verificationsResponse = { success: false, data: { verifications: [] } };
      }

      if (dashboardResponse.success) {
        const dashboardData = dashboardResponse.data;
        setStats({
          ...dashboardData,
          pendingVerifications: verificationsResponse.data?.verifications?.length || 0,
        });
      } else {
        setStats({
          totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
          serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
          payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
          reviews: { totalReviews: 0, averageRating: 0 },
          topMechanics: [],
          pendingVerifications: 0,
        });
      }

      const activity = [];

      if (dashboardResponse.data?.payments?.recentTransactions) {
        dashboardResponse.data.payments.recentTransactions.forEach((transaction) => {
          activity.push({
            type: 'payment',
            title: 'Payment received',
            description: `${transaction.customerId?.name || 'Customer'} paid ${formatCurrency(transaction.amount)}`,
            time: new Date(transaction.createdAt).toLocaleString(),
            icon: 'payment',
            status: transaction.status,
          });
        });
      }

      if (verificationsResponse.data?.verifications) {
        verificationsResponse.data.verifications.slice(0, 5).forEach((verification) => {
          activity.push({
            type: 'verification',
            title: 'New verification request',
            description: `${verification.mechanicId?.name || 'Mechanic'} submitted verification`,
            time: new Date(verification.createdAt).toLocaleString(),
            icon: 'verification',
            status: verification.status,
          });
        });
      }

      setRecentActivity(activity.slice(0, 10));
    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
      toast.error('Failed to load dashboard data');
      setStats({
        totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
        serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
        payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
        reviews: { totalReviews: 0, averageRating: 0 },
        topMechanics: [],
        pendingVerifications: 0,
      });
    } finally {
      setLoading(false);
    }
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
      <div className="rounded-hero bg-primary-900 p-6 text-white shadow-card">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-200">
          admin overview
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
          Welcome back, {user?.name}.
        </h1>
        <p className="mt-2 text-sm text-primary-200">
          Manage platform health, service flow, and operational momentum.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Users',
            value: stats.totalUsers.total.toLocaleString(),
            meta: `${stats.totalUsers.customers} customers, ${stats.totalUsers.mechanics} mechanics`,
            icon: UsersIcon,
            iconClass: 'bg-primary-100 text-primary-900',
          },
          {
            label: 'Total Mechanics',
            value: stats.totalUsers.mechanics,
            meta: stats.topMechanics.length > 0 ? `${stats.topMechanics.length} top performers` : 'No data',
            icon: WrenchScrewdriverIcon,
            iconClass: 'bg-success-50 text-success-700',
          },
          {
            label: 'Total Requests',
            value: stats.serviceRequests.total.toLocaleString(),
            meta: `${stats.serviceRequests.pending} pending, ${stats.serviceRequests.completed} completed`,
            icon: DocumentTextIcon,
            iconClass: 'bg-warning-50 text-warning-700',
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(stats.payments.totalAmount),
            meta: `${stats.payments.totalTransactions} transactions`,
            icon: CurrencyDollarIcon,
            iconClass: 'bg-surface text-primary-900',
          },
        ].map(({ label, value, meta, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-secondary-700">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
                <p className="mt-1 text-xs text-secondary-500">{meta}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: 'Pending Requests', value: stats.serviceRequests.pending, icon: ClockIcon, tint: 'bg-warning-50 text-warning-700' },
          { label: 'Completed Requests', value: stats.serviceRequests.completed.toLocaleString(), icon: CheckCircleIcon, tint: 'bg-success-50 text-success-700' },
          { label: 'Pending Verifications', value: stats.pendingVerifications, icon: ExclamationTriangleIcon, tint: 'bg-danger-50 text-danger-700' },
        ].map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
        <h2 className="text-lg font-medium text-ink">Quick actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/admin/users" className="flex items-center rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-soft">
            <UsersIcon className="h-8 w-8 text-primary-900" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-ink">Manage Users</h3>
              <p className="text-sm text-secondary-600">View and manage all users</p>
            </div>
          </Link>

          <Link to="/admin/verifications" className="flex items-center rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-soft">
            <DocumentTextIcon className="h-8 w-8 text-primary-900" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-ink">Verifications</h3>
              <p className="text-sm text-secondary-600">Review mechanic verifications</p>
            </div>
          </Link>

          <Link to="/admin/service-requests" className="flex items-center rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-soft">
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary-900" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-ink">Service Requests</h3>
              <p className="text-sm text-secondary-600">Monitor all service requests</p>
            </div>
          </Link>

          <Link to="/admin/analytics" className="flex items-center rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-soft">
            <ChartBarIcon className="h-8 w-8 text-primary-900" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-ink">Analytics</h3>
              <p className="text-sm text-secondary-600">View detailed analytics</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-white shadow-card">
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-lg font-medium text-ink">Recent activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                    {activity.type === 'payment' ? (
                      <CurrencyDollarIcon className="h-4 w-4 text-success-700" />
                    ) : activity.type === 'verification' ? (
                      <DocumentTextIcon className="h-4 w-4 text-primary-900" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-success-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{activity.title}</p>
                    <p className="text-sm text-secondary-600">{activity.description}</p>
                  </div>
                  <div className="text-xs text-secondary-500">{activity.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-secondary-500">No recent activity</div>
          )}
        </div>
      </div>

      {stats.topMechanics.length > 0 && (
        <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
          <h2 className="text-lg font-medium text-ink">Top performing mechanics</h2>
          <div className="mt-4 space-y-4">
            {stats.topMechanics.slice(0, 5).map((mechanic, index) => (
              <div key={mechanic.id || index} className="flex items-center justify-between rounded-xl border border-hairline bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-900">
                    {mechanic.name?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{mechanic.name}</p>
                    <p className="text-xs text-secondary-500">{mechanic.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">⭐ {mechanic.rating?.toFixed(1) || 'N/A'}</p>
                  <p className="text-xs text-secondary-500">{mechanic.completedJobs || 0} jobs completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
