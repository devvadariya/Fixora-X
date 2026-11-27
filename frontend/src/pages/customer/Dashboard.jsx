import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import CustomerSurface from '../../components/customer/CustomerSurface';
import requestService from '../../services/requestService';
import paymentApi from '../../api/paymentApi';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS } from '../../utils/constants';
import UnifiedPaymentModal from '../../components/payment/UnifiedPaymentModal';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingPayments();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent requests
      const requestsResponse = await requestService.getMyRequests({ 
        limit: 5, 
        page: 1 
      });
      
      if (requestsResponse.success) {
        const requestsData = requestsResponse.data.items || [];
        setRequests(requestsData);
        
        // Calculate stats
        const totalRequests = requestsData.length;
        const activeRequests = requestsData.filter(req => 
          ['pending', 'assigned', 'enroute', 'in_progress'].includes(req.status)
        ).length;
        const completedRequests = requestsData.filter(req => 
          req.status === 'completed'
        ).length;
        const totalSpent = requestsData
          .filter(req => req.status === 'completed' && req.quotation)
          .reduce((sum, req) => sum + req.quotation, 0);
        
        setStats({
          totalRequests,
          activeRequests,
          completedRequests,
          totalSpent,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await paymentApi.getPaymentHistory({
        status: 'pending',
        limit: 5
      });
      
      if (response.success) {
        setPendingPayments(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const handlePaymentClick = (request) => {
    setSelectedRequest(request);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment completed successfully!');
    setShowPaymentModal(false);
    setSelectedRequest(null);
    // Refresh dashboard data
    fetchDashboardData();
    fetchPendingPayments();
  };

  const handlePaymentFailure = (error) => {
    toast.error('Payment failed. Please try again.');
    setShowPaymentModal(false);
    setSelectedRequest(null);
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request permanently?')) {
      return;
    }

    try {
      const response = await requestService.deleteRequest(requestId);
      if (response.success) {
        toast.success('Request deleted successfully');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete request');
    }
  };

  const canDelete = (request) => {
    const hasMechanic = request.mechanic || request.mechanicId;
    return request.status === 'pending' && !hasMechanic;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'assigned':
      case 'enroute':
      case 'in_progress':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-primary-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-secondary-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <CustomerSurface
      eyebrow="Customer dashboard"
      title="Manage roadside support from one place."
      description="Track active requests, settle payments, and jump into booking without having to re-learn the interface between screens."
      actions={(
        <Link to="/customer/mechanics">
          <Button variant="primary" icon={<PlusIcon className="h-5 w-5" />}>
            Request help now
          </Button>
        </Link>
      )}
      stats={[
        { value: stats.totalRequests, label: 'total requests' },
        { value: stats.activeRequests, label: 'active requests' },
        { value: stats.completedRequests, label: 'completed requests' },
        { value: formatCurrency(stats.totalSpent), label: 'total spent' },
      ]}
    >
      <Card variant="promo" className="bg-gradient-to-r from-primary-900 via-brand-purple to-brand-magenta">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
              Always on
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Keep your service requests, payments, and follow-ups in one calm flow.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              The refreshed dashboard gives you a quicker snapshot of what is pending, what is complete, and what still needs attention.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/customer/requests">
              <Button variant="secondary" className="w-full justify-center">View request history</Button>
            </Link>
            <Link to="/customer/payments">
              <Button variant="tertiary" className="w-full justify-center">Review payments</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
          <h2 className="text-lg font-semibold text-primary-900">Recent requests</h2>
          <Link to="/customer/requests">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        <div className="mt-6">
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
              <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-4 text-lg font-semibold text-primary-900">No requests yet</h3>
              <p className="mt-2 text-sm leading-7 text-secondary-600">
                Create your first request to start tracking service progress here.
              </p>
              <div className="mt-6">
                <Link to="/customer/mechanics">
                  <Button variant="primary" icon={<PlusIcon className="h-5 w-5" />}>
                    Create request
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request._id} className="flex flex-col gap-4 rounded-3xl border border-hairline bg-white p-5 transition-colors hover:bg-surface lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">{getStatusIcon(request.status)}</div>
                    <div>
                      <h3 className="text-base font-semibold text-primary-900">
                        {request.issueType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {request.location.address || 'Location provided'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(request.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${request.status === 'completed' && request.paymentStatus !== 'paid' ? 'bg-warning-50 text-warning-700' : 'bg-surface text-primary-900'}`}>
                      {request.status === 'completed'
                        ? (request.paymentStatus === 'paid' ? 'Completed with payment' : 'Payment pending')
                        : REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    {request.quotation && <span className="text-sm font-semibold text-primary-900">{formatCurrency(request.quotation)}</span>}
                    {canDelete(request) && (
                      <button
                        onClick={() => handleDeleteRequest(request._id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-danger-600 transition-colors hover:bg-danger-50"
                        title="Delete request"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {pendingPayments.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
            <h2 className="text-lg font-semibold text-primary-900">Pending payments</h2>
            <Link to="/customer/payments">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {pendingPayments.map((payment) => (
              <div key={payment._id} className="flex flex-col gap-4 rounded-3xl border border-hairline bg-white p-5 transition-colors hover:bg-surface lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning-50 text-warning-600">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-primary-900">
                      {payment.serviceRequest?.issueType?.replace('_', ' ') || 'Service payment'}
                    </h3>
                    <p className="mt-1 text-sm text-secondary-600">
                      <span className="font-semibold text-primary-900">{formatCurrency(payment.amount)}</span>
                      <span className="mx-2">•</span>
                      <span>Due {formatDate(payment.createdAt)}</span>
                    </p>
                  </div>
                </div>

                <Button variant="primary" size="sm" onClick={() => handlePaymentClick(payment.serviceRequest)}>
                  Pay now
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-primary-900">Need emergency help?</h3>
          <p className="mt-2 text-sm leading-7 text-secondary-600">
            Create a high-priority request when you need support fast.
          </p>
          <Link to="/customer/mechanics" className="mt-5 block">
            <Button variant="danger" className="w-full">Emergency request</Button>
          </Link>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-primary-900">Track an active request</h3>
          <p className="mt-2 text-sm leading-7 text-secondary-600">
            Open the live request view and follow the current service flow.
          </p>
          <Link to="/customer/requests?status=active" className="mt-5 block">
            <Button variant="primary" className="w-full">Track request</Button>
          </Link>
        </Card>
      </div>

      {showPaymentModal && selectedRequest && (
        <UnifiedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          serviceRequest={selectedRequest}
          paymentType="post-completion"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}
    </CustomerSurface>
  );
};

export default CustomerDashboard;
