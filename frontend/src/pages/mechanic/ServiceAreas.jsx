import {
  CheckIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import mechanicApi from "../../api/mechanicApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { formatCurrency } from "../../utils/helpers";

const ServiceAreas = () => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 10,
    basePrice: "",
    description: "",
  });

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  const fetchServiceAreas = async () => {
    try {
      setLoading(true);
      const response = await mechanicApi.getServiceAreas();
      if (response.success) {
        setServiceAreas(response.data.serviceAreas || []);
      }
    } catch (error) {
      console.error("Error fetching service areas:", error);
      toast.error("Failed to load service areas");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingArea) {
        // Update existing area
        const response = await mechanicApi.updateServiceArea(
          editingArea._id,
          formData,
        );
        if (response.success) {
          setServiceAreas((prev) =>
            prev.map((area) =>
              area._id === editingArea._id ? response.data.serviceArea : area,
            ),
          );
          toast.success("Service area updated successfully!");
        }
      } else {
        // Add new area
        const response = await mechanicApi.addServiceArea(formData);
        if (response.success) {
          setServiceAreas((prev) => [...prev, response.data.serviceArea]);
          toast.success("Service area added successfully!");
        }
      }

      resetForm();
    } catch (error) {
      console.error("Error saving service area:", error);
      toast.error("Failed to save service area");
    }
  };

  const handleDelete = async (areaId) => {
    if (!window.confirm("Are you sure you want to delete this service area?")) {
      return;
    }

    try {
      const response = await mechanicApi.removeServiceArea(areaId);
      if (response.success) {
        setServiceAreas((prev) => prev.filter((area) => area._id !== areaId));
        toast.success("Service area deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting service area:", error);
      toast.error("Failed to delete service area");
    }
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setFormData({
      name: area.name || "",
      address: area.address || "",
      latitude: area.location?.coordinates?.[1] || "",
      longitude: area.location?.coordinates?.[0] || "",
      radius: area.radius || 10,
      basePrice: area.basePrice || "",
      description: area.description || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      radius: 10,
      basePrice: "",
      description: "",
    });
    setEditingArea(null);
    setShowAddForm(false);
  };

  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-success-100 text-success-800"
            : "bg-secondary-100 text-secondary-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary-900">
            Service Areas
          </h1>
          <p className="mt-1 text-secondary-600">
            Manage your service coverage areas and pricing
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add Service Area
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-primary-900">
              {editingArea ? "Edit Service Area" : "Add New Service Area"}
            </h2>
            <Button
              variant="secondary"
              onClick={resetForm}
              icon={<XMarkIcon className="h-4 w-4" />}
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Area Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Downtown, North Zone"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Base Price (₹)
                </label>
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    handleInputChange("basePrice", e.target.value)
                  }
                  placeholder="Minimum service charge"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Address *
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address of the service area"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleInputChange("latitude", e.target.value)
                  }
                  placeholder="e.g., 12.9716"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleInputChange("longitude", e.target.value)
                  }
                  placeholder="e.g., 77.5946"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Service Radius (km)
                </label>
                <Input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => handleInputChange("radius", e.target.value)}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Additional details about this service area..."
                className="w-full rounded-[16px] border border-hairline bg-surface px-3 py-2.5 text-sm text-primary-900 placeholder:text-secondary-400 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={
                  editingArea ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )
                }
              >
                {editingArea ? "Update Area" : "Add Area"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-hairline bg-white">
        <div className="border-b border-hairline px-6 py-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Your Service Areas ({serviceAreas.length})
          </h3>
        </div>

        {serviceAreas.length === 0 ? (
          <div className="p-6 text-center">
            <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-secondary-400" />
            <p className="text-primary-900">No service areas added yet</p>
            <p className="mt-1 text-sm text-secondary-500">
              Add your first service area to start receiving requests
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {serviceAreas.map((area) => (
              <div key={area._id} className="p-6 hover:bg-surface">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-secondary-700">
                        <MapPinIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-primary-900">
                          {area.name}
                        </h4>
                        <p className="text-sm text-secondary-600">
                          {area.address}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-secondary-500">Radius:</span>
                        <span className="ml-1 font-medium text-primary-900">
                          {area.radius} km
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Base Price:</span>
                        <span className="ml-1 font-medium text-primary-900">
                          {area.basePrice
                            ? formatCurrency(area.basePrice)
                            : "Not set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Status:</span>
                        <span className="ml-1">
                          {getStatusBadge(area.isActive)}
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary-500">Requests:</span>
                        <span className="ml-1 font-medium text-primary-900">
                          {area.requestCount || 0}
                        </span>
                      </div>
                    </div>

                    {area.description && (
                      <p className="mt-2 text-sm leading-6 text-secondary-600">
                        {area.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(area)}
                      icon={<PencilIcon className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(area._id)}
                      icon={<TrashIcon className="h-4 w-4" />}
                      className="border-danger-300 text-danger-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-primary-200 bg-primary-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-primary-900">
          💡 Tips for Service Areas
        </h4>
        <ul className="space-y-1 text-sm text-primary-700">
          <li>
            • Set realistic service radius based on your travel preferences
          </li>
          <li>
            • Use descriptive names to help customers identify your coverage
          </li>
          <li>• Set competitive base prices to attract more customers</li>
          <li>
            • Keep your service areas updated as your availability changes
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceAreas;
