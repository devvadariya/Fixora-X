import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await adminService.getUsers(params);

      if (response.success) {
        setUsers(response.data.users || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 0,
          totalItems: response.data.pagination?.totalItems || 0,
        }));
      } else {
        toast.error(response.message || 'Failed to fetch users');
        setUsers([]);
        setPagination((prev) => ({
          ...prev,
          totalPages: 0,
          totalItems: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
      setUsers([]);
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
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      const response = await adminService.updateUserStatus(userId, { isActive });

      if (response.success) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      const response = await adminService.verifyUser(userId);

      if (response.success) {
        toast.success('User verified successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to verify user');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to perform bulk action');
      return;
    }

    try {
      const response = await adminService.bulkUserActions({
        userIds: selectedUsers,
        action,
      });

      if (response.success) {
        toast.success(`Bulk ${action} completed successfully`);
        setSelectedUsers([]);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(users.map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'customer':
        return <UserIcon className="h-5 w-5 text-primary-900" />;
      case 'mechanic':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-success-700" />;
      case 'admin':
        return <ShieldCheckIcon className="h-5 w-5 text-warning-700" />;
      default:
        return <UserIcon className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';
    switch (role) {
      case 'customer':
        return `${baseClasses} bg-primary-100 text-primary-900`;
      case 'mechanic':
        return `${baseClasses} bg-success-50 text-success-700`;
      case 'admin':
        return `${baseClasses} bg-warning-50 text-warning-700`;
      default:
        return `${baseClasses} bg-surface text-secondary-700`;
    }
  };

  const getStatusBadge = (isActive, isVerified) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';

    if (!isActive) {
      return `${baseClasses} bg-danger-50 text-danger-700`;
    }

    if (!isVerified) {
      return `${baseClasses} bg-warning-50 text-warning-700`;
    }

    return `${baseClasses} bg-success-50 text-success-700`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">User management</h1>
          <p className="text-sm text-secondary-600">Manage all users on the platform</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <>
              <Button variant="secondary" onClick={() => handleBulkAction('activate')} disabled={loading}>
                Activate selected
              </Button>
              <Button variant="secondary" onClick={() => handleBulkAction('deactivate')} disabled={loading}>
                Deactivate selected
              </Button>
            </>
          )}
        </div>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Input
              label="Search"
              placeholder="Search by name, email, or phone"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />

            <Select label="Role" value={filters.role} onChange={(e) => handleFilterChange('role', e.target.value)}>
              <option value="">All roles</option>
              <option value="customer">Customer</option>
              <option value="mechanic">Mechanic</option>
              <option value="admin">Admin</option>
            </Select>

            <Select label="Status" value={filters.isActive} onChange={(e) => handleFilterChange('isActive', e.target.value)}>
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>

            <Select label="Sort by" value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
              <option value="createdAt">Registration date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="rating">Rating</option>
            </Select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="border-b border-hairline px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-ink">Users ({pagination.totalItems})</h2>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-hairline text-primary-900 focus:ring-primary-900"
              />
              <span className="text-sm text-secondary-600">Select all</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-900" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-secondary-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-white">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-surface">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => handleSelectUser(user._id, e.target.checked)}
                          className="mr-3 h-4 w-4 rounded border-hairline text-primary-900 focus:ring-primary-900"
                        />
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.avatar ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={user.avatar} alt={user.name} />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-secondary-600">
                                {getRoleIcon(user.role)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-ink">{user.name}</div>
                            <div className="text-sm text-secondary-500">{user.email}</div>
                            {user.phone && <div className="text-sm text-secondary-500">{user.phone}</div>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={getRoleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={getStatusBadge(user.isActive, user.isVerified)}>
                        {!user.isActive ? 'Inactive' : !user.isVerified ? 'Unverified' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500">{formatDate(user.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserStatusChange(user._id, !user.isActive)}
                          className={`rounded p-1 ${user.isActive ? 'text-danger-700 hover:text-danger-900' : 'text-success-700 hover:text-success-900'}`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                        </button>

                        {!user.isVerified && (
                          <button
                            onClick={() => handleVerifyUser(user._id)}
                            className="rounded p-1 text-primary-900 hover:text-primary-700"
                            title="Verify user"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}

                        <button className="rounded p-1 text-secondary-600 hover:text-ink" title="View details">
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        <button className="rounded p-1 text-secondary-600 hover:text-ink" title="Edit user">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of {pagination.totalItems} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
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

export default UserManagement;
