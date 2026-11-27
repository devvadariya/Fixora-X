import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import paymentApi from "../../api/paymentApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import CustomerSurface from "../../components/customer/CustomerSurface";
import { formatCurrency, formatDate } from "../../utils/helpers";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentHistory({
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      if (response.success) {
        setPayments(response.data.payments || []);
      } else {
        setError(response.message || "Failed to fetch payment history");
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setError("Failed to load payment history");
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-success-700" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-danger-700" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-warning-700" />;
      default:
        return <ClockIcon className="h-5 w-5 text-secondary-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-success-700 bg-success-50";
      case "failed":
        return "text-danger-700 bg-danger-50";
      case "pending":
        return "text-warning-700 bg-warning-50";
      default:
        return "text-secondary-700 bg-surface";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <CustomerSurface
      eyebrow="Payments"
      title="Payment history"
      description="Review completed, pending, and failed payments in a cleaner table layout."
      stats={[
        { value: payments.length, label: "visible payments" },
        { value: filters.status || "all", label: "current filter" },
      ]}
    >
      <Card>
        <div className="flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-900">Filters</h2>
            <p className="mt-1 text-sm text-secondary-600">
              Narrow the list by status or date range.
            </p>
          </div>
          <CreditCardIcon className="h-8 w-8 text-primary-900" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-2xl border border-hairline bg-white px-3 py-2.5 text-sm focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            >
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Start date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-2xl border border-hairline bg-white px-3 py-2.5 text-sm focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              End date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full rounded-2xl border border-hairline bg-white px-3 py-2.5 text-sm focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            />
          </div>
        </div>
      </Card>

      <Card>
        {error ? (
          <div className="rounded-3xl border border-danger-200 bg-danger-50 px-6 py-10 text-center">
            <p className="text-sm text-danger-700">{error}</p>
            <Button onClick={fetchPaymentHistory} className="mt-4">
              Retry
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-hairline bg-surface px-6 py-10 text-center">
            <CreditCardIcon className="mx-auto h-12 w-12 text-secondary-400" />
            <p className="mt-4 text-sm text-secondary-600">
              No payment history found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline">
              <thead>
                <tr className="bg-surface text-left text-xs uppercase tracking-[0.2em] text-secondary-500">
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-white">
                {payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="transition-colors hover:bg-surface/70"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface text-secondary-600">
                          <CreditCardIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-primary-900">
                            {payment.razorpayPaymentId || payment._id.slice(-8)}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {payment.paymentMethod || "Online payment"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-medium text-primary-900">
                        {payment.serviceRequest?.issueType
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {payment.serviceRequest?.vehicleInfo?.model || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-semibold text-primary-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(payment.status)}`}
                      >
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-secondary-600">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(payment.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </CustomerSurface>
  );
};

export default PaymentHistory;
