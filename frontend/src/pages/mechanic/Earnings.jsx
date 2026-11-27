import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  ChartBarIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  FireIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import mechanicApi from "../../api/mechanicApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import MechanicSurface from "../../components/mechanic/MechanicSurface";
import { formatCurrency, formatDate } from "../../utils/helpers";

const Earnings = () => {
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [detailedEarnings, setDetailedEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "month",
    startDate: "",
    endDate: "",
  });
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountType: "Savings",
    amount: "",
  });

  useEffect(() => {
    fetchEarningsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, detailedResponse] = await Promise.all([
        mechanicApi.getEarningsSummary(filters),
        mechanicApi.getDetailedEarnings(filters),
      ]);

      if (summaryResponse.success) {
        setEarningsSummary(summaryResponse.data);
      }

      if (detailedResponse.success) {
        setDetailedEarnings(detailedResponse.data.earnings || []);
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportEarnings = async () => {
    try {
      const response = await mechanicApi.exportEarnings(filters);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `earnings-${filters.period}-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Earnings exported successfully!");
    } catch (error) {
      console.error("Error exporting earnings:", error);
      toast.error("Failed to export earnings");
    }
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-success-600" />;
    } else if (growth < 0) {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-danger-600" />;
    }
    return null;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return "text-success-700";
    if (growth < 0) return "text-danger-700";
    return "text-secondary-600";
  };

  const handleRedeemWallet = async (e) => {
    e.preventDefault();
    if (!bankDetails.amount || parseFloat(bankDetails.amount) < 100) {
      toast.error("Minimum redemption amount is ₹100");
      return;
    }

    if (
      parseFloat(bankDetails.amount) > (earningsSummary?.walletBalance || 0)
    ) {
      toast.error("Insufficient wallet balance");
      return;
    }

    try {
      setIsRedeeming(true);
      const response = await mechanicApi.redeemWallet({
        amount: parseFloat(bankDetails.amount),
        bankDetails: {
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountType: bankDetails.accountType,
        },
      });

      if (response.success) {
        toast.success(response.message || "Amount redeemed successfully!");
        setShowRedeemModal(false);
        setBankDetails({ ...bankDetails, amount: "" });
        fetchEarningsData(); // Refresh summary
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to redeem amount");
    } finally {
      setIsRedeeming(false);
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
    <MechanicSurface
      eyebrow="Earnings"
      title="Track your revenue and wallet balance."
      description="See earnings, request volume, and available balance in a cleaner operational view."
      actions={
        <Button
          variant="primary"
          onClick={handleExportEarnings}
          icon={<ArrowDownTrayIcon className="h-4 w-4" />}
        >
          Export earnings
        </Button>
      }
      stats={
        earningsSummary
          ? [
              {
                value: formatCurrency(earningsSummary.totalEarnings),
                label: "total earnings",
              },
              {
                value: formatCurrency(earningsSummary.walletBalance || 0),
                label: "wallet balance",
              },
              { value: earningsSummary.totalRequests, label: "total requests" },
              {
                value: earningsSummary.completedRequests,
                label: "completed requests",
              },
            ]
          : []
      }
    >
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Period
            </label>
            <Select
              value={filters.period}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, period: e.target.value }))
              }
              options={[
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "quarter", label: "This Quarter" },
                { value: "year", label: "This Year" },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-primary-900 focus:border-primary-900 focus:outline-none focus-visible:ring-2 focus:ring-primary-900/10"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={fetchEarningsData}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {earningsSummary && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary-900 to-brand-purple text-white md:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-white/15 p-2">
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <span className="rounded-full bg-white/10 px-2 py-1 text-sm font-medium text-primary-100">
                Wallet
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-100">
                Available Balance
              </p>
              <h2 className="mt-1 text-3xl font-bold">
                {formatCurrency(earningsSummary.walletBalance || 0)}
              </h2>
            </div>
            <div className="mt-6">
              <Button
                variant="secondary"
                className="w-full border-white bg-white text-primary-900 hover:bg-primary-50"
                onClick={() => setShowRedeemModal(true)}
              >
                Redeem to Bank
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2 lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-primary-900">
                    {formatCurrency(earningsSummary.totalEarnings)}
                  </p>
                  <div className="mt-2 flex items-center">
                    {getGrowthIcon(earningsSummary.growth)}
                    <span
                      className={`ml-1 text-sm font-medium ${getGrowthColor(earningsSummary.growth)}`}
                    >
                      {earningsSummary.growth > 0 ? "+" : ""}
                      {earningsSummary.growth}% vs last period
                    </span>
                  </div>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-success-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-primary-900">
                    {earningsSummary.totalRequests}
                  </p>
                  <p className="mt-2 text-sm text-secondary-500">
                    {earningsSummary.completedRequests} completed
                  </p>
                </div>
                <WrenchScrewdriverIcon className="h-8 w-8 text-primary-900" />
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Average Earning
                </p>
                <p className="text-2xl font-bold text-primary-900">
                  {formatCurrency(earningsSummary.averageEarning)}
                </p>
                <p className="mt-2 text-sm text-secondary-500">per request</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-brand-blue" />
            </div>
          </Card>

          <Card className="hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Growth Rate
                </p>
                <p className="text-2xl font-bold text-primary-900">
                  {earningsSummary.growth}%
                </p>
                <p className="mt-2 text-sm text-secondary-500">
                  vs previous period
                </p>
              </div>
              <FireIcon className="h-8 w-8 text-warning-500" />
            </div>
          </Card>
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-hairline bg-white">
        <div className="border-b border-hairline px-6 py-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Recent Earnings
          </h3>
        </div>

        {detailedEarnings.length === 0 ? (
          <div className="p-6 text-center">
            <CurrencyDollarIcon className="mx-auto mb-4 h-12 w-12 text-secondary-400" />
            <p className="text-secondary-500">
              No earnings data found for the selected period
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-hairline-soft">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Service Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft bg-white">
                {detailedEarnings.map((earning) => (
                  <tr key={earning._id} className="hover:bg-surface">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary-900">
                          {earning.serviceRequest?.issueType
                            ? earning.serviceRequest.issueType
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())
                            : "General Service"}
                        </div>
                        <div className="text-sm text-secondary-500">
                          Req: #
                          {earning.serviceRequest?._id?.toString().slice(-6) ||
                            "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4 text-secondary-400" />
                        <div className="text-sm text-primary-900">
                          {earning.customer?.name || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-primary-900">
                        {formatCurrency(earning.amount)}
                      </div>
                      {earning.processingFee > 0 && (
                        <div className="text-xs text-secondary-500">
                          Fee: {formatCurrency(earning.processingFee)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-secondary-400" />
                        <div className="text-sm text-primary-900">
                          {formatDate(earning.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-xs font-mono text-secondary-500">
                        {earning.paymentId ||
                          earning.transactionId ||
                          earning.receipt ||
                          earning._id}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          earning.status === "success"
                            ? "bg-success-100 text-success-800"
                            : earning.status === "pending"
                              ? "bg-warning-100 text-warning-800"
                              : "bg-danger-100 text-danger-800"
                        }`}
                      >
                        {earning.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRedeemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowRedeemModal(false)}
            ></div>

            <div className="inline-block w-full max-w-lg transform overflow-hidden rounded-[24px] bg-white align-bottom text-left shadow-xl transition-all sm:my-8 sm:align-middle">
              <form onSubmit={handleRedeemWallet}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                      <BanknotesIcon className="h-6 w-6 text-primary-900" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-semibold text-primary-900">
                        Redeem Wallet Balance
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-secondary-500">
                          Transfer your earnings to your bank account. Minimum
                          redemption is ₹100.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <Input
                      label="Amount to Redeem (₹)"
                      type="number"
                      placeholder="Enter amount"
                      required
                      min="100"
                      max={earningsSummary?.walletBalance || 0}
                      value={bankDetails.amount}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          amount: e.target.value,
                        })
                      }
                    />

                    <Input
                      label="Account Number"
                      type="text"
                      placeholder="Enter bank account number"
                      required
                      value={bankDetails.accountNumber}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          accountNumber: e.target.value,
                        })
                      }
                    />

                    <Input
                      label="IFSC Code"
                      type="text"
                      placeholder="Enter bank IFSC code"
                      required
                      value={bankDetails.ifscCode}
                      onChange={(e) =>
                        setBankDetails({
                          ...bankDetails,
                          ifscCode: e.target.value,
                        })
                      }
                    />

                    <div className="rounded-[18px] bg-primary-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CreditCardIcon
                            className="h-5 w-5 text-primary-900"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-primary-900">
                            Demonstration Mode
                          </p>
                          <p className="mt-1 text-sm text-secondary-600">
                            Use fake bank details for testing. Transfer is
                            simulated.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 bg-surface px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowRedeemModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isRedeeming}
                  >
                    {isRedeeming ? "Processing..." : "Redeem Now"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MechanicSurface>
  );
};

export default Earnings;
