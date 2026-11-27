import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import MechanicSurface from '../../components/mechanic/MechanicSurface';
import VerificationForm from '../../components/mechanic/VerificationForm';
import NavigationModal from '../../components/mechanic/NavigationModal';
import RequestDetailsModal from '../../components/mechanic/RequestDetailsModal';
import mechanicApi from '../../api/mechanicApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS, ISSUE_TYPE_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';
import socketService from '../../services/socketService';

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [verification, setVerification] = useState(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await mechanicApi.updateRequestStatus(requestId, newStatus);
      if (response.success) {
        toast.success(`Request ${newStatus} successfully`);
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update request status');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    checkVerificationStatus();
    setupSocketListeners();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await mechanicApi.updateProfile({
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            });
          } catch (e) {
            // Non-critical background update
          }
        },
        () => {},
        { timeout: 8000 }
      );
    }

    return () => {
      // Cleanup socket listeners
      socketService.off('new-request-available');
      socketService.off('request-taken');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupSocketListeners = () => {
    // Join mechanic area for receiving broadcast requests
    if (user && user._id && user.location) {
      socketService.joinMechanicArea(user._id, user.location);
    }

    // Listen for new available requests
    socketService.onNewRequestAvailable((requestData) => {
      console.log('New request available:', requestData);
      toast.success(`New ${requestData.issueType} request available nearby!`);
      // Refresh dashboard data to show new request
      fetchDashboardData();
    });

    // Listen for requests taken by other mechanics
    socketService.onRequestTaken((data) => {
      console.log('Request taken by another mechanic:', data);
      // Refresh dashboard data
      fetchDashboardData();
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      console.log('Fetching dashboard data...');

      // Fetch assigned requests and stats (including available broadcast requests)
      const [requestsResponse, statsResponse] = await Promise.all([
        mechanicApi.getAssignedRequests({ limit: 5, page: 1, includeAvailable: true }),
        mechanicApi.getStats()
      ]);

      console.log('Requests response:', requestsResponse);
      console.log('Stats response:', statsResponse);

      if (requestsResponse.success) {
        const requestsData = requestsResponse.data.items || requestsResponse.data.requests || [];
        console.log('Setting requests:', requestsData);
        setRequests(requestsData);
      } else {
        console.error('Requests response not successful:', requestsResponse);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        console.error('Stats response not successful:', statsResponse);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await mechanicApi.getVerificationStatus();
      if (response.success && response.data.verification) {
        setVerification(response.data.verification);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationForm(false);
    checkVerificationStatus();
    toast.success('Verification submitted successfully!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'offered':
        return <ClockIcon className="h-5 w-5 text-primary-500" />;
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

  const getVerificationStatusDisplay = () => {
    if (!verification) {
      return (
        <div className="rounded-[24px] border border-warning-200 bg-warning-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 text-warning-700">
              <ExclamationTriangleIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-warning-800">Verification Required</h3>
              <p className="mt-1 text-sm text-warning-700">
                You need to complete your shop verification to start receiving service requests.
              </p>
              <Button
                onClick={() => setShowVerificationForm(true)}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                Start Verification
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const statusConfig = {
      pending: {
        icon: <ClockIcon className="h-5 w-5 text-warning-600" />,
        color: 'text-warning-700',
        bgColor: 'bg-warning-50',
        borderColor: 'border-warning-200',
        title: 'Verification Pending',
        description: 'Your verification request is under review. You can still view requests but cannot accept them yet.'
      },
      approved: {
        icon: <CheckCircleIcon className="h-5 w-5 text-success-600" />,
        color: 'text-success-700',
        bgColor: 'bg-success-50',
        borderColor: 'border-success-200',
        title: 'Verification Approved',
        description: 'Your account is verified! You can now accept and complete service requests.'
      },
      rejected: {
        icon: <XCircleIcon className="h-5 w-5 text-danger-600" />,
        color: 'text-danger-700',
        bgColor: 'bg-danger-50',
        borderColor: 'border-danger-200',
        title: 'Verification Rejected',
        description: verification.rejectionReason || 'Your verification request was not approved. Please submit a new one.'
      }
    };

    const config = statusConfig[verification.status];

    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-[24px] p-5`}>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.color}`}>{config.title}</h3>
            <p className="mt-1 text-sm text-secondary-600">{config.description}</p>
            {verification.status === 'rejected' && (
              <Button
                onClick={() => setShowVerificationForm(true)}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                Submit New Verification
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <MechanicSurface
      eyebrow="Mechanic dashboard"
      title={`Welcome back, ${user?.name || 'mechanic'}.`}
      description="Monitor incoming work, verification status, and your current availability in one operational view."
      actions={(
        <Link to="/mechanic/chat">
          <Button variant="secondary" icon={<ChatBubbleLeftIcon className="w-4 h-4" />}>
            View messages
          </Button>
        </Link>
      )}
      stats={[
        { value: stats.totalRequests, label: 'total requests' },
        { value: stats.activeRequests, label: 'active requests' },
        { value: stats.completedRequests, label: 'completed requests' },
        { value: formatCurrency(stats.totalEarnings), label: 'total earnings' },
      ]}
    >
      <Card className="border border-hairline bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">Availability</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary-900 sm:text-4xl">
              Stay ready for the next request.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary-600 sm:text-base">
              Keep your workflow focused: handle requests, navigate efficiently, and keep customers updated without losing the operational context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <span className="inline-flex items-center rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-primary-900">Online & available</span>
            <span className="inline-flex items-center rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-primary-900">Last active just now</span>
          </div>
        </div>
      </Card>

      {/* Verification Status */}
      {getVerificationStatusDisplay()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Requests</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary-900">{stats.totalRequests}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary-900">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Active Requests</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary-900">{stats.activeRequests}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-50 text-warning-700">
              <ClockIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Completed</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary-900">{stats.completedRequests}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-700">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Earnings</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary-900">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-700">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-hairline px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-primary-900">Recent Requests</h2>
            <Link
              to="/mechanic/requests"
              className="text-sm font-medium text-primary-900 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-3 text-sm font-semibold text-primary-900">No requests yet</h3>
            <p className="mt-1 text-sm text-secondary-600">
              {verification?.status === 'approved'
                ? 'You\'ll see service requests here when they become available.'
                : 'Complete your verification to start receiving requests.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {requests.map((request) => (
              <div key={request._id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary-900">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-semibold text-primary-900">
                          {ISSUE_TYPE_LABELS[request.issueType] || request.issueType}
                        </h3>
                        <span className="inline-flex w-fit items-center rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary-700">
                          {request.status === 'completed' && request.paymentStatus === 'paid' ? 'Payment Done' :
                           request.status === 'completed' ? 'Payment Pending' :
                           request.status === 'offered' ? 'Offered / Waiting' :
                           request.status === 'pending' ? 'Available Nearby' :
                           REQUEST_STATUS_LABELS[request.status]}
                        </span>
                      </div>

                      <div className="grid gap-3 text-sm text-secondary-600 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-secondary-500" />
                          <span>{request.location.address || 'Location provided'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-primary-900">Vehicle:</span> {request.vehicleInfo.model} ({request.vehicleInfo.plate})
                        </div>
                        <div>
                          <span className="font-medium text-primary-900">Created:</span> {formatDate(request.createdAt)}
                        </div>
                      </div>

                      {request.description && (
                        <p className="mt-3 text-sm leading-6 text-secondary-600">
                          {request.description}
                        </p>
                      )}

                      {request.quotation && (
                        <div className="mt-3 text-sm text-secondary-700">
                          <span className="font-medium text-primary-900">{request.status === 'pending' ? 'Base Price:' : 'Proposed Price:'}</span> {formatCurrency(request.status === 'pending' ? (request.basePrice || request.quotation) : (request.mechanicOfferPrice || request.quotation))}
                        </div>
                      )}
                      {request.status === 'pending' && request.userExpectedPrice > 0 && (
                        <div className="mt-1 text-sm text-secondary-600">
                          <span className="font-medium text-primary-900">Customer Budget:</span> {formatCurrency(request.userExpectedPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {request.status === 'pending' ? (
                      <Link to={`/mechanic/requests/${request._id}`}>
                        <Button variant="primary" size="sm">Accept & Offer Price</Button>
                      </Link>
                    ) : (
                      <Link to={`/mechanic/requests/${request._id}`}>
                        <Button variant="secondary" size="sm">View Details</Button>
                      </Link>
                    )}
                    {(request.status === 'assigned' || request.status === 'enroute') && (
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowNavigationModal(true);
                        }}
                        icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                      >
                        Navigate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="rounded-[24px] border border-hairline bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold text-primary-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Link
            to="/mechanic/requests"
            className="group flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-4 transition-colors duration-200 hover:bg-surface-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-900">
              <WrenchScrewdriverIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">View All Requests</h3>
              <p className="text-xs text-secondary-600">Available work</p>
            </div>
          </Link>

          <Link
            to="/mechanic/calendar"
            className="group flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-4 transition-colors duration-200 hover:bg-surface-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-900">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">Service Calendar</h3>
              <p className="text-xs text-secondary-600">Track schedule</p>
            </div>
          </Link>

          <Link
            to="/mechanic/profile"
            className="group flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-4 transition-colors duration-200 hover:bg-surface-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-900">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">Update Profile</h3>
              <p className="text-xs text-secondary-600">Manage settings</p>
            </div>
          </Link>

          <Link
            to="/mechanic/earnings"
            className="group flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-4 transition-colors duration-200 hover:bg-surface-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-900">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">View Earnings</h3>
              <p className="text-xs text-secondary-600">Payments overview</p>
            </div>
          </Link>

          <Link
            to="/mechanic/chat"
            className="group flex items-center gap-4 rounded-[20px] border border-hairline bg-surface p-4 transition-colors duration-200 hover:bg-surface-soft"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-900">
              <ChatBubbleLeftIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">Messages</h3>
              <p className="text-xs text-secondary-600">Chat with customers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Verification Form Modal */}
      {showVerificationForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowVerificationForm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-[24px] border border-hairline text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <VerificationForm onSuccess={handleVerificationSuccess} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setShowDetailsModal(false)}
          onStatusUpdate={handleStatusUpdate}
          onNavigate={(request) => {
            setSelectedRequest(request);
            setShowDetailsModal(false);
            setShowNavigationModal(true);
          }}
        />
      )}

      {/* Navigation Modal */}
      <NavigationModal
        isOpen={showNavigationModal}
        onClose={() => setShowNavigationModal(false)}
        request={selectedRequest}
        mechanicLocation={user?.location}
      />
    </MechanicSurface>
  );
};

export default MechanicDashboard;
