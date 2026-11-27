import React, { useState, useEffect } from 'react';
import { UserIcon, ShieldCheckIcon, CogIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab]);

  const fetchActivity = async () => {
    try {
      const response = await adminService.getActivity();
      if (response.success) {
        setActivity(response.data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminService.updateProfile(profileData);

      if (response.success) {
        toast.success('Profile updated successfully');
        updateUser(response.data.user);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await adminService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);

    try {
      const response = await adminService.uploadAvatar(formData);

      if (response.success) {
        toast.success('Avatar uploaded successfully');
        updateUser(response.data.user);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'activity', name: 'Activity', icon: BellIcon },
    { id: 'system', name: 'System', icon: CogIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Settings</h1>
        <p className="text-sm text-secondary-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-hairline bg-white shadow-card">
            <nav className="space-y-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-900 text-white shadow-card'
                        : 'text-secondary-600 hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <h2 className="mb-6 text-lg font-medium text-ink">Profile information</h2>

              <div className="mb-6 flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {user?.avatar ? (
                    <img className="h-20 w-20 rounded-full object-cover" src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
                      <UserIcon className="h-10 w-10 text-secondary-600" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-700">Profile picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-900 hover:file:bg-surface-soft"
                  />
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    disabled
                  />
                </div>
                <Input
                  label="Phone number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                  Update profile
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <h2 className="mb-6 text-lg font-medium text-ink">Security settings</h2>

              <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                <Input
                  label="Current password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
                <Input
                  label="New password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
                <Button type="submit" variant="primary" loading={loading} disabled={loading}>
                  Change password
                </Button>
              </form>

              <div className="mt-8 border-t border-hairline pt-6">
                <h3 className="mb-4 text-base font-medium text-ink">Account information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-secondary-600">Role:</span>
                    <span className="text-sm font-medium text-ink">{user?.role}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-secondary-600">Member since:</span>
                    <span className="text-sm font-medium text-ink">{formatDate(user?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-secondary-600">Last login:</span>
                    <span className="text-sm font-medium text-ink">{user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <h2 className="mb-6 text-lg font-medium text-ink">Recent activity</h2>

              <div className="space-y-4">
                {activity.length > 0 ? (
                  activity.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                        <BellIcon className="h-4 w-4 text-primary-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{item.action}</p>
                        <p className="text-sm text-secondary-600">{item.description}</p>
                      </div>
                      <div className="text-sm text-secondary-500">{formatDate(item.timestamp)}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <BellIcon className="mx-auto mb-4 h-12 w-12 text-secondary-400" />
                    <p className="text-sm text-secondary-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
              <h2 className="mb-6 text-lg font-medium text-ink">System information</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-base font-medium text-ink">Platform status</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      'API operational',
                      'Database connected',
                      'Payment gateway active',
                      'Email service running',
                    ].map((item) => (
                      <div key={item} className="rounded-xl border border-success-200 bg-success-50 p-4">
                        <div className="flex items-center">
                          <div className="mr-3 h-3 w-3 rounded-full bg-success-600" />
                          <span className="text-sm font-medium text-success-900">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-base font-medium text-ink">Version information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-secondary-600">Platform version:</span>
                      <span className="text-sm font-medium text-ink">v1.0.0</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-secondary-600">Last updated:</span>
                      <span className="text-sm font-medium text-ink">{formatDate(new Date())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
