import {
  CameraIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import CustomerSurface from "../../components/customer/CustomerSurface";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail } from "../../utils/helpers";

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      // Update profile API call would go here
      toast.success("Profile updated successfully!");
      setEditing(false);
      // Update user context
      updateUser({ ...user, ...formData });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerSurface
      eyebrow="Profile"
      title="Keep your account details current."
      description="Your profile now uses the same calmer framing as the rest of the customer workspace, with clearer spacing and actions."
      actions={
        <Button
          variant={editing ? "secondary" : "primary"}
          onClick={() => setEditing(!editing)}
          icon={<PencilIcon className="w-4 h-4" />}
        >
          {editing ? "Cancel" : "Edit profile"}
        </Button>
      }
      stats={[
        { value: "Verified", label: "account status" },
        { value: user?.email ? "Set" : "Unset", label: "email on file" },
      ]}
    >
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-primary-900 to-brand-purple">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-white" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white text-secondary-600 shadow-soft transition-colors hover:bg-surface">
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-primary-900">
                {user?.name}
              </h1>
              <p className="mt-1 text-secondary-600">{user?.email}</p>
              <span className="mt-3 inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                Verified customer
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-primary-900">
          Personal information
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<UserIcon className="w-5 h-5" />}
              required
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<EnvelopeIcon className="w-5 h-5" />}
              required
            />
            <Input
              label="Phone number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<PhoneIcon className="w-5 h-5" />}
            />
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<MapPinIcon className="w-5 h-5" />}
            />
          </div>

          {editing && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Save changes
              </Button>
            </div>
          )}
        </form>
      </Card>
    </CustomerSurface>
  );
};

export default CustomerProfile;
