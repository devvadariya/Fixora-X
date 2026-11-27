import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";
import Button from "../common/Button";

const RequestDetailsModal = ({
  request,
  onClose,
  onStatusUpdate,
  onNavigate,
}) => {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!request) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !updating) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, request, updating]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(request._id, newStatus);
      }
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  const openGoogleMaps = () => {
    if (!request?.location) return;

    const { lat, lng, address } = request.location;
    const destination = address || `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank");
  };

  const callCustomer = () => {
    if (request?.customerId?.phone) {
      window.open(`tel:${request.customerId.phone}`, "_self");
    }
  };

  const copyAddressToClipboard = async () => {
    if (!request?.location?.address) return;

    try {
      await navigator.clipboard.writeText(request.location.address);
      toast.success("Address copied to clipboard");
    } catch (error) {
      console.error("Failed to copy address:", error);
      toast.error("Failed to copy address");
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-primary-900/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full transform overflow-hidden rounded-2xl border border-hairline bg-white text-left shadow-modal transition-all sm:my-8 sm:max-w-4xl sm:align-middle">
          <div
            className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-details-title"
          >
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="flex justify-between items-start mb-6">
                  <h3
                    id="request-details-title"
                    className="text-xl font-semibold tracking-[-0.04em] text-ink"
                  >
                    Service Request Details
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === "completed"
                          ? "bg-success-50 text-success-700"
                          : request.status === "cancelled"
                            ? "bg-danger-50 text-danger-700"
                            : "bg-primary-100 text-primary-900"
                      }`}
                    >
                      {request.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-hairline bg-surface p-4">
                      <h4 className="mb-3 font-semibold text-ink">
                        Request Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Request ID
                          </label>
                          <p className="font-mono text-sm text-ink">
                            #{request._id.slice(-8)}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Issue Type
                          </label>
                          <p className="text-sm capitalize text-ink">
                            {request.issueType.replace("_", " ")}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Priority
                          </label>
                          <p className="text-sm capitalize text-ink">
                            {request.priority || "Medium"}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Description
                          </label>
                          <p className="rounded-lg border border-hairline bg-white p-2 text-sm text-ink">
                            {request.description}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Created
                          </label>
                          <p className="text-sm text-ink">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>

                        {request.acceptedAt && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-secondary-700">
                              Accepted
                            </label>
                            <p className="text-sm text-ink">
                              {formatDate(request.acceptedAt)}
                            </p>
                          </div>
                        )}

                        {request.quotation && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-secondary-700">
                              Quotation
                            </label>
                            <p className="text-lg font-semibold text-success-700">
                              ₹{request.quotation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Customer & Location */}
                  <div className="space-y-4">
                    {/* Customer Information */}
                    <div className="rounded-xl border border-hairline bg-surface p-4">
                      <h4 className="mb-3 font-semibold text-ink">
                        Customer Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Name
                          </label>
                          <p className="text-sm text-ink">
                            {request.customerId?.name ||
                              "Customer name not available"}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Phone
                          </label>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-secondary-500" />
                            <span className="text-sm text-ink">
                              {request.customerId?.phone ||
                                "Phone not available"}
                            </span>
                            {request.customerId?.phone && (
                              <button
                                onClick={callCustomer}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                Call
                              </button>
                            )}
                          </div>
                        </div>

                        {request.customerId?.email && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-secondary-700">
                              Email
                            </label>
                            <p className="text-sm text-ink">
                              {request.customerId.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="rounded-xl border border-hairline bg-surface p-4">
                      <h4 className="mb-3 font-semibold text-ink">
                        Service Location
                      </h4>
                      <div className="space-y-3">
                        {/* Exact Coordinates */}
                        <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
                          <label className="mb-2 block text-sm font-medium text-primary-900">
                            📍 Exact Coordinates (Copy for Navigation)
                          </label>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-primary-900">
                                Latitude:
                              </span>
                              <span className="rounded border border-hairline bg-white px-2 py-1 font-mono text-sm text-primary-900">
                                {request.location.lat.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-primary-900">
                                Longitude:
                              </span>
                              <span className="rounded border border-hairline bg-white px-2 py-1 font-mono text-sm text-primary-900">
                                {request.location.lng.toFixed(6)}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const coords = `${request.location.lat.toFixed(6)}, ${request.location.lng.toFixed(6)}`;
                                navigator.clipboard.writeText(coords);
                                toast.success(
                                  "Coordinates copied to clipboard",
                                );
                              }}
                              className="w-full rounded-full bg-primary-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2"
                            >
                              Copy Coordinates
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-secondary-700">
                            Address
                          </label>
                          <div className="flex items-start gap-2">
                            <MapPinIcon className="mt-0.5 h-4 w-4 text-secondary-500" />
                            <div className="flex-1">
                              <p className="text-sm text-ink">
                                {request.location.address ||
                                  "Address not specified"}
                              </p>
                              {request.location.address && (
                                <button
                                  onClick={copyAddressToClipboard}
                                  className="mt-1 rounded px-1 text-xs font-medium text-primary-900 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900"
                                >
                                  Copy Address
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={openGoogleMaps}
                            className="flex-1 rounded-full bg-primary-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-2"
                          >
                            Open in Maps
                          </button>
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate(request)}
                              className="flex-1 rounded-full bg-success-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-success-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-success-600 focus-visible:ring-offset-2"
                            >
                              Navigate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="rounded-xl border border-hairline bg-surface p-4">
                      <h4 className="mb-3 font-semibold text-ink">
                        Service Vehicle
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Type:</span>
                          <span className="font-medium capitalize">
                            {request.vehicleInfo.type}
                          </span>
                        </div>
                        {request.vehicleInfo.make && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">Make:</span>
                            <span className="font-medium">
                              {request.vehicleInfo.make}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Model:</span>
                          <span className="font-medium">
                            {request.vehicleInfo.model}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Plate:</span>
                          <span className="font-medium font-mono">
                            {request.vehicleInfo.plate}
                          </span>
                        </div>
                        {request.vehicleInfo.year && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">Year:</span>
                            <span className="font-medium">
                              {request.vehicleInfo.year}
                            </span>
                          </div>
                        )}
                        {request.vehicleInfo.color && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">Color:</span>
                            <span className="font-medium capitalize">
                              {request.vehicleInfo.color}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer's Vehicles */}
                    {request.customerId?.vehicles &&
                      request.customerId.vehicles.length > 0 && (
                        <div className="rounded-xl border border-hairline bg-surface p-4">
                          <h4 className="mb-3 font-semibold text-ink">
                            Customer's Vehicles
                          </h4>
                          <div className="space-y-3">
                            {request.customerId.vehicles.map(
                              (vehicle, index) => (
                                <div
                                  key={vehicle._id || index}
                                  className="rounded-xl border border-hairline bg-white p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-ink">
                                      {vehicle.name}
                                    </h5>
                                    {vehicle.isDefault && (
                                      <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-secondary-600">
                                        Type:
                                      </span>
                                      <span className="font-medium capitalize">
                                        {vehicle.type}
                                      </span>
                                    </div>
                                    {vehicle.make && (
                                      <div className="flex justify-between">
                                        <span className="text-secondary-600">
                                          Make:
                                        </span>
                                        <span className="font-medium">
                                          {vehicle.make}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-secondary-600">
                                        Model:
                                      </span>
                                      <span className="font-medium">
                                        {vehicle.model}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-secondary-600">
                                        Plate:
                                      </span>
                                      <span className="font-medium font-mono">
                                        {vehicle.plate}
                                      </span>
                                    </div>
                                    {vehicle.year && (
                                      <div className="flex justify-between">
                                        <span className="text-secondary-600">
                                          Year:
                                        </span>
                                        <span className="font-medium">
                                          {vehicle.year}
                                        </span>
                                      </div>
                                    )}
                                    {vehicle.color && (
                                      <div className="flex justify-between">
                                        <span className="text-secondary-600">
                                          Color:
                                        </span>
                                        <span className="font-medium capitalize">
                                          {vehicle.color}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Additional Information */}
                    <div className="rounded-xl border border-hairline bg-surface p-4">
                      <h4 className="mb-3 font-semibold text-ink">
                        Additional Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {request.broadcastRadius && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">
                              Broadcast Radius:
                            </span>
                            <span className="font-medium">
                              {request.broadcastRadius} km
                            </span>
                          </div>
                        )}
                        {request.estimatedDuration && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">
                              Estimated Duration:
                            </span>
                            <span className="font-medium">
                              {request.estimatedDuration} minutes
                            </span>
                          </div>
                        )}
                        {request.actualDuration && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">
                              Actual Duration:
                            </span>
                            <span className="font-medium">
                              {request.actualDuration} minutes
                            </span>
                          </div>
                        )}
                        {request.estimatedArrival && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">
                              Estimated Arrival:
                            </span>
                            <span className="font-medium">
                              {request.estimatedArrival} minutes
                            </span>
                          </div>
                        )}
                        {request.isDirectChat && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600">
                              Direct Booking:
                            </span>
                            <span className="font-medium text-success-700">
                              Yes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Images Section */}
                    {request.images && request.images.length > 0 && (
                      <div className="rounded-xl border border-hairline bg-surface p-4">
                        <h4 className="mb-3 font-semibold text-ink">
                          Request Images
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {request.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Request attachment ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-hairline bg-surface px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
            {request.status === "assigned" && onStatusUpdate && (
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate("enroute")}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Start Journey
              </Button>
            )}

            {request.status === "enroute" && onStatusUpdate && (
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate("in_progress")}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Start Work
              </Button>
            )}

            {request.status === "in_progress" && onStatusUpdate && (
              <Button
                variant="success"
                onClick={() => handleStatusUpdate("completed")}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Complete Request
              </Button>
            )}

            <Button variant="outline" onClick={onClose} disabled={updating}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
