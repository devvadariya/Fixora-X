import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import api from "../../services/api";
import { DESIGN_COLORS } from "../../utils/constants";
import { formatCurrency } from "../../utils/helpers";

const withAlpha = (hex, alpha) => {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

const DashboardStats = () => {
  const [stats, setStats] = useState({
    overview: {
      totalUsers: 0,
      totalMechanics: 0,
      totalRequests: 0,
      totalRevenue: 0,
      activeRequests: 0,
      completedRequests: 0,
      avgResponseTime: 0,
      customerSatisfaction: 0,
    },
    trends: {
      userGrowth: 0,
      revenueGrowth: 0,
      requestGrowth: 0,
      mechanicGrowth: 0,
    },
    charts: {
      requestsByStatus: {},
      revenueByMonth: [],
      requestsByType: {},
      mechanicPerformance: [],
      userGrowth: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d"); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/admin/dashboard/stats?range=${timeRange}`,
      );
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  // Request status chart data
  const requestStatusData = {
    labels: Object.keys(stats.charts.requestsByStatus),
    datasets: [
      {
        data: Object.values(stats.charts.requestsByStatus),
        backgroundColor: [
          DESIGN_COLORS.warning,
          DESIGN_COLORS.blueMid,
          DESIGN_COLORS.purple,
          DESIGN_COLORS.success,
          DESIGN_COLORS.danger,
        ],
        borderWidth: 2,
        borderColor: DESIGN_COLORS.canvas,
      },
    ],
  };

  // Revenue chart data
  const revenueData = {
    labels: stats.charts.revenueByMonth.map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: stats.charts.revenueByMonth.map((item) => item.revenue),
        backgroundColor: withAlpha(DESIGN_COLORS.blueMid, 0.1),
        borderColor: DESIGN_COLORS.blueMid,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Request types chart data
  const requestTypesData = {
    labels: Object.keys(stats.charts.requestsByType).map((type) =>
      type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    ),
    datasets: [
      {
        label: "Number of Requests",
        data: Object.values(stats.charts.requestsByType),
        backgroundColor: [
          withAlpha(DESIGN_COLORS.coral, 0.8),
          withAlpha(DESIGN_COLORS.blue, 0.8),
          withAlpha(DESIGN_COLORS.warning, 0.8),
          withAlpha(DESIGN_COLORS.cyan, 0.8),
          withAlpha(DESIGN_COLORS.purple, 0.8),
          withAlpha(DESIGN_COLORS.coral, 0.8),
        ],
      },
    ],
  };

  // User growth chart data
  const userGrowthData = {
    labels: stats.charts.userGrowth.map((item) => item.date),
    datasets: [
      {
        label: "Customers",
        data: stats.charts.userGrowth.map((item) => item.customers),
        borderColor: DESIGN_COLORS.success,
        backgroundColor: withAlpha(DESIGN_COLORS.success, 0.1),
        tension: 0.4,
      },
      {
        label: "Mechanics",
        data: stats.charts.userGrowth.map((item) => item.mechanics),
        borderColor: DESIGN_COLORS.danger,
        backgroundColor: withAlpha(DESIGN_COLORS.danger, 0.1),
        tension: 0.4,
      },
    ],
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = "primary",
  }) => {
    const colorClasses = {
      primary: "bg-primary-100 text-primary-600",
      success: "bg-success-100 text-success-600",
      warning: "bg-warning-100 text-warning-600",
      danger: "bg-danger-100 text-danger-600",
    };

    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-secondary-600">{title}</p>
            <p className="text-2xl font-bold text-secondary-900">{value}</p>
          </div>
          {trend && (
            <div
              className={`flex items-center ${trend === "up" ? "text-success-600" : "text-danger-600"}`}
            >
              {trend === "up" ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">{trendValue}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">
          Dashboard Analytics
        </h1>
        <div className="flex space-x-2">
          {[
            { label: "7 Days", value: "7d" },
            { label: "30 Days", value: "30d" },
            { label: "90 Days", value: "90d" },
            { label: "1 Year", value: "1y" },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range.value
                  ? "bg-primary-600 text-white"
                  : "bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-300"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.overview.totalUsers.toLocaleString()}
          icon={UsersIcon}
          trend={stats.trends.userGrowth > 0 ? "up" : "down"}
          trendValue={Math.abs(stats.trends.userGrowth)}
          color="primary"
        />
        <StatCard
          title="Active Mechanics"
          value={stats.overview.totalMechanics.toLocaleString()}
          icon={WrenchScrewdriverIcon}
          trend={stats.trends.mechanicGrowth > 0 ? "up" : "down"}
          trendValue={Math.abs(stats.trends.mechanicGrowth)}
          color="success"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.overview.totalRevenue)}
          icon={CurrencyDollarIcon}
          trend={stats.trends.revenueGrowth > 0 ? "up" : "down"}
          trendValue={Math.abs(stats.trends.revenueGrowth)}
          color="warning"
        />
        <StatCard
          title="Active Requests"
          value={stats.overview.activeRequests.toLocaleString()}
          icon={ClockIcon}
          trend={stats.trends.requestGrowth > 0 ? "up" : "down"}
          trendValue={Math.abs(stats.trends.requestGrowth)}
          color="danger"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-900">
              {stats.overview.completedRequests}
            </p>
            <p className="text-sm text-secondary-600">Completed Requests</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-900">
              {stats.overview.avgResponseTime}min
            </p>
            <p className="text-sm text-secondary-600">Avg Response Time</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-900">
              {stats.overview.customerSatisfaction}%
            </p>
            <p className="text-sm text-secondary-600">Customer Satisfaction</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-900">
              {(
                (stats.overview.completedRequests /
                  stats.overview.totalRequests) *
                  100 || 0
              ).toFixed(1)}
              %
            </p>
            <p className="text-sm text-secondary-600">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Status Distribution */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Request Status Distribution
          </h3>
          <div className="h-64">
            <Doughnut data={requestStatusData} options={doughnutOptions} />
          </div>
        </div>

        {/* Request Types */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Request Types
          </h3>
          <div className="h-64">
            <Bar data={requestTypesData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Revenue Trend
          </h3>
          <div className="h-64">
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            User Growth
          </h3>
          <div className="h-64">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Mechanics Performance */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Top Performing Mechanics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-medium text-secondary-900">
                  Mechanic
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">
                  Completed Jobs
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">
                  Rating
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 font-medium text-secondary-900">
                  Response Time
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.charts.mechanicPerformance
                .slice(0, 5)
                .map((mechanic, index) => (
                  <tr
                    key={mechanic.id}
                    className="border-b border-secondary-100"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-primary-600 font-bold text-sm">
                            {mechanic.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-secondary-900">
                          {mechanic.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary-700">
                      {mechanic.completedJobs}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-secondary-700">
                          {mechanic.rating.toFixed(1)}
                        </span>
                        <span className="text-warning-400 ml-1">⭐</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary-700">
                      {formatCurrency(mechanic.revenue)}
                    </td>
                    <td className="py-3 px-4 text-secondary-700">
                      {mechanic.avgResponseTime}min
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
