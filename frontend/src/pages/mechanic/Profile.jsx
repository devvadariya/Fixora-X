import {
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PencilIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import MechanicSurface from "../../components/mechanic/MechanicSurface";

import toast from "react-hot-toast";
import mechanicApi from "../../api/mechanicApi";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/helpers";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    shopName: "",
    shopAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    specializations: [],
    experience: "",
    bio: "",
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
    serviceRadius: 10,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileResponse, statsResponse] = await Promise.all([
        mechanicApi.getProfile(),
        mechanicApi.getStats(),
      ]);

      if (profileResponse.success) {
        const pData = profileResponse.data.profile || profileResponse.data;
        setProfile(pData);
        setFormData({
          name: pData.name || "",
          phone: pData.phone || "",
          shopName: pData.shopName || "",
          shopAddress: pData.shopAddress || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          specializations: pData.specializations || [],
          experience: pData.experience || "",
          bio: pData.bio || "",
          workingHours: pData.workingHours || { start: "09:00", end: "18:00" },
          serviceRadius: pData.serviceRadius || 10,
        });
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSpecializationChange = (specialization) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await mechanicApi.updateProfile(formData);

      if (response.success) {
        setProfile(response.data);
        setEditing(false);
        updateUser(response.data);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await mechanicApi.uploadAvatar(formData);
      if (response.success) {
        setProfile((prev) => ({ ...prev, avatar: response.data.avatar }));
        updateUser({ ...user, avatar: response.data.avatar });
        toast.success("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: "bg-success-100 text-success-800", icon: CheckCircleIcon },
      pending: { color: "bg-warning-100 text-warning-800", icon: ClockIcon },
      rejected: { color: "bg-danger-100 text-danger-800", icon: XCircleIcon },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <MechanicSurface
      eyebrow="Profile"
      title="Keep your mechanic profile current."
      description="Update the information customers see, while keeping the operational details clear for your workflow."
      actions={
        !editing ? (
          <Button
            variant="primary"
            onClick={() => setEditing(true)}
            icon={<PencilIcon className="h-4 w-4" />}
          >
            Edit profile
          </Button>
        ) : null
      }
      stats={[
        { value: profile?.shopName ? "Set" : "Unset", label: "shop name" },
        {
          value: stats?.verificationStatus || "pending",
          label: "verification",
        },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-primary-900">
                Basic information
              </h2>
              {editing && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={saving}
                  >
                    Save changes
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Full Name
                </label>
                {editing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.name || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Phone Number
                </label>
                {editing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.phone || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Email
                </label>
                <p className="text-primary-900">{profile?.email}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Experience (Years)
                </label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      handleInputChange("experience", e.target.value)
                    }
                    placeholder="Years of experience"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.experience || "Not specified"} years
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                Bio
              </label>
              {editing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself and your expertise..."
                  className="w-full rounded-[16px] border border-hairline bg-surface px-3 py-2.5 text-sm text-primary-900 placeholder:text-secondary-400 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
                  rows={3}
                />
              ) : (
                <p className="text-primary-900">
                  {profile?.bio || "No bio provided"}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-primary-900">
              Shop details
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Shop Name
                </label>
                {editing ? (
                  <Input
                    value={formData.shopName || ""}
                    onChange={(e) =>
                      handleInputChange("shopName", e.target.value)
                    }
                    placeholder="Enter your shop name"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopName || "Not provided"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Street Address
                </label>
                {editing ? (
                  <Input
                    value={formData.shopAddress?.street || ""}
                    onChange={(e) =>
                      handleInputChange("shopAddress.street", e.target.value)
                    }
                    placeholder="Enter street address"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopAddress?.street || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  City
                </label>
                {editing ? (
                  <Input
                    value={formData.shopAddress?.city || ""}
                    onChange={(e) =>
                      handleInputChange("shopAddress.city", e.target.value)
                    }
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopAddress?.city || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  State
                </label>
                {editing ? (
                  <Input
                    value={formData.shopAddress?.state || ""}
                    onChange={(e) =>
                      handleInputChange("shopAddress.state", e.target.value)
                    }
                    placeholder="Enter state"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopAddress?.state || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  ZIP Code
                </label>
                {editing ? (
                  <Input
                    value={formData.shopAddress?.zipCode || ""}
                    onChange={(e) =>
                      handleInputChange("shopAddress.zipCode", e.target.value)
                    }
                    placeholder="Enter ZIP code"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopAddress?.zipCode || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Country
                </label>
                {editing ? (
                  <Input
                    value={formData.shopAddress?.country || ""}
                    onChange={(e) =>
                      handleInputChange("shopAddress.country", e.target.value)
                    }
                    placeholder="Enter country"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.shopAddress?.country || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="rounded-[24px] border border-hairline bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">
              Specializations
            </h2>
            {editing ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  "Engine Repair",
                  "Brake System",
                  "Electrical",
                  "AC/Heating",
                  "Transmission",
                  "Suspension",
                  "Tire Service",
                  "Diagnostics",
                ].map((spec) => (
                  <label key={spec} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={() => handleSpecializationChange(spec)}
                      className="rounded border-hairline text-primary-900 focus:ring-primary-900"
                    />
                    <span className="ml-2 text-sm text-secondary-700">
                      {spec}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.specializations?.length > 0 ? (
                  profile.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-900"
                    >
                      {spec}
                    </span>
                  ))
                ) : (
                  <p className="text-secondary-500">No specializations added</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-hairline bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-primary-900">
              Working Hours & Service Area
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Start Time
                </label>
                {editing ? (
                  <Input
                    type="time"
                    value={formData.workingHours.start}
                    onChange={(e) =>
                      handleInputChange("workingHours.start", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.workingHours?.start || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  End Time
                </label>
                {editing ? (
                  <Input
                    type="time"
                    value={formData.workingHours.end}
                    onChange={(e) =>
                      handleInputChange("workingHours.end", e.target.value)
                    }
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.workingHours?.end || "Not set"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Service Radius (km)
                </label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.serviceRadius}
                    onChange={(e) =>
                      handleInputChange("serviceRadius", e.target.value)
                    }
                    min="1"
                    max="50"
                  />
                ) : (
                  <p className="text-primary-900">
                    {profile?.serviceRadius || "Not set"} km
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-hairline bg-white p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={profile?.avatar || "/default-avatar.png"}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-4 border-hairline object-cover"
                />
                {editing && (
                  <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary-900 text-white">
                    <CameraIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-primary-900">
                {profile?.name}
              </h3>
              <p className="text-secondary-600">{profile?.email}</p>

              <div className="mt-3">
                {getStatusBadge(profile?.verificationStatus || "pending")}
              </div>

              {profile?.rating && (
                <div className="mt-3 flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-warning-500" />
                  <span className="ml-1 text-primary-900">
                    {profile.rating.toFixed(1)}
                  </span>
                  <span className="ml-1 text-secondary-600">
                    ({profile.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {stats && (
            <div className="rounded-[24px] border border-hairline bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-primary-900">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Requests</span>
                  <span className="font-semibold text-primary-900">
                    {stats.totalRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Completed</span>
                  <span className="font-semibold text-success-700">
                    {stats.completedRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Earnings</span>
                  <span className="font-semibold text-success-700">
                    {formatCurrency(stats.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Average Rating</span>
                  <span className="font-semibold text-primary-900">
                    {stats.averageRating?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[24px] border border-hairline bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-primary-900">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                icon={<WrenchScrewdriverIcon className="h-4 w-4" />}
              >
                View Assigned Requests
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                icon={<CurrencyDollarIcon className="h-4 w-4" />}
              >
                View Earnings
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                icon={<StarIcon className="h-4 w-4" />}
              >
                View Reviews
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MechanicSurface>
  );
};

export default Profile;
