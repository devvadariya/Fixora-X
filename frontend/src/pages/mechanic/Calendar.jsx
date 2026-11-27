import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import mechanicApi from "../../api/mechanicApi";
import Button from "../../components/common/Button";
import { REQUEST_STATUS_LABELS } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchMonthRequests = async () => {
    try {
      setLoading(true);

      console.log("Fetching all assigned requests for calendar...");

      // Fetch all requests assigned to this mechanic (all types) without date filtering
      const response = await mechanicApi.getAssignedRequests({
        limit: 1000, // Get more requests
        // Don't specify status to get all requests including completed ones
      });

      console.log("Calendar API response:", response);

      if (response.success) {
        const requestsData = response.data.items || [];
        console.log("Setting requests:", requestsData.length, "requests");

        // Filter requests for the current month (all statuses)
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );

        const monthRequests = requestsData.filter((request) => {
          const requestDate = new Date(request.createdAt);
          return requestDate >= startOfMonth && requestDate <= endOfMonth;
        });

        console.log(
          "Filtered requests for current month:",
          monthRequests.length,
        );
        setRequests(monthRequests);
      } else {
        console.log("API response not successful:", response);
        // If API fails, try to fetch without status filter
        try {
          const fallbackResponse = await mechanicApi.getAssignedRequests({
            limit: 1000,
          });
          if (fallbackResponse.success) {
            const fallbackData = fallbackResponse.data.items || [];
            console.log(
              "Fallback: Setting requests:",
              fallbackData.length,
              "requests",
            );
            setRequests(fallbackData);
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }
    } catch (error) {
      console.error("Error fetching month requests:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getRequestsForDate = (date) => {
    if (!date) return [];

    const dateString = date.toISOString().split("T")[0];
    return requests.filter((request) => {
      const requestDate = new Date(request.createdAt)
        .toISOString()
        .split("T")[0];
      return requestDate === dateString;
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-warning-100 text-warning-800",
      assigned: "bg-primary-100 text-primary-900",
      enroute: "bg-brand-purple/10 text-brand-purple",
      in_progress: "bg-warning-50 text-warning-700",
      completed: "bg-success-100 text-success-800",
      cancelled: "bg-danger-100 text-danger-800",
    };
    return statusColors[status] || "bg-secondary-100 text-secondary-800";
  };

  const handleDateClick = (date) => {
    const dayRequests = getRequestsForDate(date);
    if (dayRequests.length > 0) {
      // If multiple requests, show the first one
      setSelectedRequest(dayRequests[0]);
      setShowRequestModal(true);
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "next") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary-900">
            Service Calendar
          </h1>
          <p className="mt-1 text-secondary-600">
            View and manage your service requests by month
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => navigateMonth("prev")}
            icon={<ChevronLeftIcon className="h-4 w-4" />}
          >
            Previous
          </Button>
          <div className="min-w-0 flex-1 text-center text-sm font-semibold text-primary-900 sm:min-w-[140px] sm:flex-none sm:text-lg">
            {formatMonthYear(currentDate)}
          </div>
          <Button
            variant="secondary"
            onClick={() => navigateMonth("next")}
            icon={<ChevronRightIcon className="h-4 w-4" />}
          >
            Next
          </Button>
          <Button
            variant="primary"
            onClick={fetchMonthRequests}
            loading={loading}
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-[24px] border border-hairline bg-white p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900"></div>
            <span className="text-secondary-600">Loading calendar data...</span>
          </div>
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-[24px] border border-hairline bg-white">
          <div className="grid grid-cols-7 gap-px bg-hairline-soft border-b border-hairline">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-surface px-3 py-2 text-center text-sm font-semibold text-primary-900"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-hairline-soft">
            {days.map((day, index) => {
              const dayRequests = getRequestsForDate(day);
              const isToday =
                day && day.toDateString() === new Date().toDateString();
              const isCurrentMonth =
                day && day.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={index}
                  className={`min-h-[140px] bg-white p-2 ${
                    dayRequests.length > 0
                      ? "cursor-pointer hover:bg-surface"
                      : ""
                  }`}
                  onClick={() => day && handleDateClick(day)}
                >
                  {day && (
                    <>
                      <div
                        className={`mb-1 flex h-6 w-6 items-center justify-center text-sm font-semibold ${
                          isToday
                            ? "rounded-full bg-primary-900 text-white"
                            : isCurrentMonth
                              ? "text-primary-900"
                              : "text-secondary-400"
                        }`}
                      >
                        {day.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayRequests.slice(0, 3).map((request) => (
                          <div
                            key={request._id}
                            className={`cursor-pointer rounded-md px-1.5 py-1 text-[11px] font-medium ${getStatusColor(request.status)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestClick(request);
                            }}
                          >
                            <div className="truncate">
                              {request.issueType
                                ?.replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <div className="truncate opacity-75">
                              {request.customer?.name || "Customer"}
                            </div>
                          </div>
                        ))}
                        {dayRequests.length > 3 && (
                          <div className="text-center text-[11px] text-secondary-500">
                            +{dayRequests.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary-900">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total Requests</p>
              <p className="text-2xl font-semibold text-primary-900">
                {requests.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-700">
              <WrenchScrewdriverIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Completed</p>
              <p className="text-2xl font-semibold text-primary-900">
                {requests.filter((r) => r.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-50 text-warning-700">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">In Progress</p>
              <p className="text-2xl font-semibold text-primary-900">
                {
                  requests.filter((r) =>
                    ["assigned", "enroute", "in_progress"].includes(r.status),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-hairline bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-700">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-primary-900">
                {formatCurrency(
                  requests
                    .filter((r) => r.status === "completed" && r.quotation)
                    .reduce((sum, r) => sum + r.quotation, 0),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-primary-900">
                  Request Details
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowRequestModal(false)}
                  icon={<XMarkIcon className="h-4 w-4" />}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-primary-900">
                    Service Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Service Type
                      </label>
                      <p className="mt-1 text-primary-900">
                        {selectedRequest.issueType
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Status
                      </label>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}
                      >
                        {REQUEST_STATUS_LABELS[selectedRequest.status] ||
                          selectedRequest.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Created
                      </label>
                      <p className="mt-1 text-primary-900">
                        {formatDate(selectedRequest.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Quotation
                      </label>
                      <p className="mt-1 text-primary-900">
                        {selectedRequest.quotation
                          ? formatCurrency(selectedRequest.quotation)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRequest.description && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-secondary-700">
                      Description
                    </label>
                    <p className="rounded-[18px] bg-surface p-3 text-primary-900">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-lg font-semibold text-primary-900">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Name
                      </label>
                      <p className="mt-1 text-primary-900">
                        {selectedRequest.customer?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Phone
                      </label>
                      <p className="mt-1 text-primary-900">
                        {selectedRequest.customer?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRequest.location && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-primary-900">
                      Location
                    </h3>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="mt-0.5 h-5 w-5 text-secondary-500" />
                      <p className="text-primary-900">
                        {selectedRequest.location.address}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.vehicle && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-primary-900">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">
                          Model
                        </label>
                        <p className="mt-1 text-primary-900">
                          {selectedRequest.vehicle.model}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">
                          Number
                        </label>
                        <p className="mt-1 text-primary-900">
                          {selectedRequest.vehicle.number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-hairline pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setShowRequestModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowRequestModal(false);
                      window.location.href = `/mechanic/requests/${selectedRequest._id}`;
                    }}
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
