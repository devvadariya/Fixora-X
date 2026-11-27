import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    issueType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchServiceRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await adminService.getServiceRequests(params);

      if (response.success) {
        setRequests(response.data.requests || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 0,
          totalItems: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast.error('Failed to fetch service requests');
      setRequests([]);
      setPagination((prev) => ({
        ...prev,
        totalPages: 0,
        totalItems: 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-warning-50 text-warning-700`;
      case 'assigned':
        return `${baseClasses} bg-primary-100 text-primary-900`;
      case 'enroute':
        return `${baseClasses} bg-warning-50 text-warning-700`;
      case 'in_progress':
        return `${baseClasses} bg-surface text-secondary-700`;
      case 'completed':
        return `${baseClasses} bg-success-50 text-success-700`;
      case 'cancelled':
        return `${baseClasses} bg-danger-50 text-danger-700`;
      case 'offered':
        return `${baseClasses} bg-warning-50 text-warning-700`;
      default:
        return `${baseClasses} bg-surface text-secondary-700`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-warning-700" />;
      case 'assigned':
        return <CheckCircleIcon className="h-4 w-4 text-primary-900" />;
      case 'enroute':
        return <ExclamationTriangleIcon className="h-4 w-4 text-warning-700" />;
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-4 w-4 text-secondary-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-success-700" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-danger-700" />;
      case 'offered':
        return <ClockIcon className="h-4 w-4 text-warning-700" />;
      default:
        return <ClockIcon className="h-4 w-4 text-secondary-500" />;
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await adminService.getServiceRequests({
        ...filters,
        export: 'csv',
      });

      if (response.success) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-requests-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV exported successfully');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Service requests</h1>
          <p className="text-sm text-secondary-600">Monitor and manage all service requests</p>
        </div>
        <Button variant="secondary" onClick={exportToCSV} disabled={loading}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Filters</h2>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <FunnelIcon className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Search"
              placeholder="Search by customer name or issue"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />

            <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="enroute">En Route</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="offered">Price Offered</option>
            </Select>

            <Select label="Issue type" value={filters.issueType} onChange={(e) => handleFilterChange('issueType', e.target.value)}>
              <option value="">All types</option>
              <option value="flat_tire">Flat Tire</option>
              <option value="battery_dead">Dead Battery</option>
              <option value="fuel_empty">Out of Fuel</option>
              <option value="engine_trouble">Engine Problem</option>
              <option value="accident">Accident</option>
              <option value="key_locked">Key Locked</option>
              <option value="overheating">Overheating</option>
              <option value="brake_failure">Brake Failure</option>
              <option value="transmission_issue">Transmission Issue</option>
              <option value="other">Other</option>
            </Select>

            <Input label="Date from" type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />

            <Input label="Date to" type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />

            <Select label="Sort by" value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
              <option value="createdAt">Request date</option>
              <option value="updatedAt">Last updated</option>
              <option value="quotation">Amount</option>
              <option value="status">Status</option>
            </Select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="border-b border-hairline px-6 py-4">
          <h2 className="text-lg font-medium text-ink">Service requests ({pagination.totalItems})</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center text-sm text-secondary-500">No service requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Request details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Mechanic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-white">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-surface">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-ink">#{request._id?.slice(-8) || 'N/A'}</div>
                        <div className="text-sm text-secondary-500">{request.issueType?.replace('_', ' ').toUpperCase() || 'N/A'}</div>
                        <div className="mt-1 text-xs text-secondary-400">
                          {request.description?.substring(0, 50) || 'No description'}
                          {request.description?.length > 50 && '...'}
                        </div>
                        {request.location?.address && <div className="text-xs text-secondary-400">📍 {request.location.address}</div>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          {request.customerId?.avatar ? (
                            <img className="h-8 w-8 rounded-full object-cover" src={request.customerId.avatar} alt={request.customerId.name} />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-medium text-secondary-600">
                              {request.customerId?.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-ink">{request.customerId?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-secondary-500">{request.customerId?.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {request.mechanicId ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0">
                            {request.mechanicId.avatar ? (
                              <img className="h-8 w-8 rounded-full object-cover" src={request.mechanicId.avatar} alt={request.mechanicId.name} />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-50 text-xs font-medium text-success-700">
                                {request.mechanicId.name?.charAt(0)?.toUpperCase() || 'M'}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-ink">{request.mechanicId.name}</div>
                            <div className="text-sm text-secondary-500">⭐ {request.mechanicId.rating?.toFixed(1) || 'N/A'}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-500">Not assigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={getStatusBadge(request.status)}>{request.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-ink">
                        {request.finalAmount ? (
                          <span>{formatCurrency(request.finalAmount)} (Final)</span>
                        ) : request.quotation ? (
                          <span>{formatCurrency(request.quotation)}</span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      {request.userExpectedPrice > 0 && <div className="text-xs text-primary-900">Exp: {formatCurrency(request.userExpectedPrice)}</div>}
                      {request.mechanicOfferPrice > 0 && !request.finalAmount && <div className="text-xs text-warning-700">Offered: {formatCurrency(request.mechanicOfferPrice)}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500">{formatDate(request.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button className="rounded p-1 text-primary-900 hover:text-primary-700" title="View details">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="border-t border-hairline px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of {pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>
                  Previous
                </Button>
                <Button variant="secondary" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceRequests;
