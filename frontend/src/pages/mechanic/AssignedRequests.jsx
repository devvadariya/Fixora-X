import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import NavigationModal from "../../components/mechanic/NavigationModal";
import RequestDetailsModal from "../../components/mechanic/RequestDetailsModal";
import { useAuth } from "../../contexts/AuthContext";
import requestService from "../../services/requestService";
import { formatDate } from "../../utils/helpers";
const AssignedRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [acceptFormData, setAcceptFormData] = useState({
    estimatedArrival: 30,
    quotation: "",
  });
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const fetchAssignedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.currentPage,
        limit: pagination.limit,
        includeAvailable: true, // Include available broadcast requests
        ...filters,
      };

      Object.keys(queryParams).forEach((key) => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });

      const response = await requestService.getAssignedRequests(queryParams);

      if (response.success) {
        setRequests(response.data.requests || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching assigned requests:", error);
      toast.error("Failed to load assigned requests");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchAssignedRequests();
  }, [fetchAssignedRequests]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await requestService.updateRequestStatus(
        requestId,
        newStatus,
      );

      if (response.success) {
        toast.success(`Request ${newStatus} successfully`);
        fetchAssignedRequests(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to update request status";
      toast.error(errorMessage);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await requestService.acceptRequest(
        requestId,
        acceptFormData,
      );

      if (response.success) {
        toast.success("Request accepted successfully");
        setShowAcceptModal(false);
        setSelectedRequest(null);
        setAcceptFormData({ estimatedArrival: 30, quotation: "" });
        fetchAssignedRequests(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to accept request";
      toast.error(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) {
      return;
    }

    try {
      const response = await requestService.rejectRequest(requestId, {
        reason: "Mechanic rejected the request",
      });

      if (response.success) {
        toast.success("Request rejected successfully");
        fetchAssignedRequests(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to reject request";
      toast.error(errorMessage);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const openAcceptModal = (request) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case "assigned":
      case "enroute":
      case "in_progress":
        return <WrenchScrewdriverIcon className="h-5 w-5 text-primary-500" />;
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning-100 text-warning-800";
      case "assigned":
        return "bg-primary-100 text-primary-900";
      case "enroute":
        return "bg-brand-purple/10 text-brand-purple";
      case "in_progress":
        return "bg-warning-50 text-warning-700";
      case "completed":
        return "bg-success-100 text-success-800";
      case "cancelled":
        return "bg-danger-100 text-danger-800";
      default:
        return "bg-secondary-100 text-secondary-800";
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
    <>
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[24px] border border-hairline bg-white p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-primary-900">Service Requests</h1>
              <p className="mt-1 text-secondary-600">Review live jobs, route status and customer requests.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
              >
                <option value="">All Requests</option>
                <option value="pending">Available & Pending</option>
                <option value="assigned">Assigned</option>
                <option value="enroute">En Route</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 placeholder:text-secondary-500 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
              />
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <ClockIcon className="mx-auto mb-4 h-16 w-16 text-secondary-400" />
              <h3 className="mb-2 text-lg font-semibold text-primary-900">No requests available</h3>
              <p className="text-secondary-600">
                You don't have any assigned service requests or available broadcast requests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="rounded-[20px] border border-hairline bg-surface p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-sm text-secondary-500">#{request._id.slice(-8)}</span>
                        {request.mechanicId &&
                          (request.status === "pending" || request.status === "assigned") && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-[11px] font-semibold text-primary-900">
                              Direct Booking
                            </span>
                          )}
                        {!request.mechanicId && request.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-1 text-[11px] font-semibold text-success-800">
                            Available
                          </span>
                        )}
                      </div>

                      <h3 className="mb-1 text-lg font-semibold text-primary-900">
                        {request.issueType.replace("_", " ").toUpperCase()}
                      </h3>

                      <p className="mb-3 line-clamp-2 text-secondary-600">{request.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{request.location.address || "Location not specified"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        {request.userExpectedPrice > 0 && (
                          <div className="font-medium text-primary-900">Expected: ₹{request.userExpectedPrice}</div>
                        )}
                        {request.quotation && (
                          <div className="ml-auto font-medium text-success-700">Offer: ₹{request.quotation}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleViewDetails(request)}>
                        View Details
                      </Button>

                      {request.status !== "pending" && request.customerId && (
                        <Link to={`/mechanic/chat?requestId=${request._id}`}>
                          <Button variant="secondary" size="sm" className="flex items-center gap-1">
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            Chat
                          </Button>
                        </Link>
                      )}

                      {request.status === "pending" && request.mechanicId && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => openAcceptModal(request)}>
                            Accept
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleRejectRequest(request._id)}>
                            Reject
                          </Button>
                        </>
                      )}

                      {request.status === "pending" && !request.mechanicId && (
                        <Button variant="primary" size="sm" onClick={() => openAcceptModal(request)}>
                          Accept Request
                        </Button>
                      )}

                      {request.status === "pending" && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAcceptFormData((prev) => ({
                              ...prev,
                              quotation: request.basePrice || 1500,
                            }));
                            setShowAcceptModal(true);
                          }}
                        >
                          Accept & Offer
                        </Button>
                      )}

                      {request.status === "offered" && (
                        <span className="text-xs italic text-secondary-500">Waiting for customer confirmation</span>
                      )}

                      {request.status === "assigned" && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(request._id, "enroute")}>
                            Start Journey
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => {
                            setSelectedRequest(request);
                            setShowNavigationModal(true);
                          }} icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}>
                            Navigate
                          </Button>
                        </>
                      )}

                      {request.status === "enroute" && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(request._id, "in_progress")}>
                            Start Work
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => {
                            setSelectedRequest(request);
                            setShowNavigationModal(true);
                          }} icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}>
                            Navigate
                          </Button>
                        </>
                      )}

                      {request.status === "in_progress" && (
                        <Button variant="success" size="sm" onClick={() => handleStatusUpdate(request._id, "completed")}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAcceptModal && selectedRequest && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-black/40">
          <div className="relative top-20 mx-auto w-[92%] max-w-xl rounded-[24px] border border-hairline bg-white p-5 shadow-card">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-semibold text-primary-900">Accept Service Request</h3>

              <div className="mb-4 space-y-2 rounded-[18px] bg-surface p-3">
                <h4 className="font-medium text-primary-900">Customer Details</h4>
                <p className="text-sm text-secondary-700"><strong>Name:</strong> {selectedRequest.customerId?.name || "N/A"}</p>
                <p className="text-sm text-secondary-700"><strong>Phone:</strong> {selectedRequest.customerId?.phone || "N/A"}</p>
                <p className="text-sm text-secondary-700"><strong>Email:</strong> {selectedRequest.customerId?.email || "N/A"}</p>
              </div>

              <div className="mb-4 space-y-2 rounded-[18px] bg-surface p-3">
                <h4 className="font-medium text-primary-900">Service Location</h4>
                <p className="text-sm text-secondary-700">{selectedRequest.location.address || "Address not specified"}</p>
                <p className="text-sm text-secondary-500">{selectedRequest.location.lat}, {selectedRequest.location.lng}</p>
              </div>

              <div className="mb-4 space-y-2 rounded-[18px] bg-surface p-3">
                <h4 className="font-medium text-primary-900">Service Details</h4>
                <p className="text-sm text-secondary-700"><strong>Issue:</strong> {selectedRequest.issueType.replace("_", " ").toUpperCase()}</p>
                <p className="text-sm text-secondary-700"><strong>Vehicle:</strong> {selectedRequest.vehicleInfo.type} - {selectedRequest.vehicleInfo.model}</p>
                <p className="text-sm text-secondary-700"><strong>Plate:</strong> {selectedRequest.vehicleInfo.plate}</p>
                <p className="text-sm text-secondary-700"><strong>Description:</strong> {selectedRequest.description}</p>
                <p className="text-sm text-secondary-700"><strong>User Expected Price:</strong> ₹{selectedRequest.userExpectedPrice || "N/A"}</p>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-secondary-700">Estimated Arrival Time (minutes)</label>
                <input
                  type="number"
                  value={acceptFormData.estimatedArrival}
                  onChange={(e) => setAcceptFormData((prev) => ({ ...prev, estimatedArrival: parseInt(e.target.value) }))}
                  className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
                  min="5"
                  max="180"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-secondary-700">Quotation (₹)</label>
                <input
                  type="number"
                  value={acceptFormData.quotation}
                  onChange={(e) => setAcceptFormData((prev) => ({ ...prev, quotation: e.target.value }))}
                  className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 placeholder:text-secondary-500 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
                  placeholder="Enter quotation amount"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowAcceptModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => handleAcceptRequest(selectedRequest._id)} className="flex-1">
                  Accept Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <NavigationModal
        isOpen={showNavigationModal}
        onClose={() => setShowNavigationModal(false)}
        request={selectedRequest}
        mechanicLocation={user?.location}
      />
    </>
  );
};

export default AssignedRequests;
