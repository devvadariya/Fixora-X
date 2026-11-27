import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageTransition from "../components/common/PageTransition";

import Analytics from "../pages/admin/Analytics";
import AdminDashboard from "../pages/admin/Dashboard";
import ServiceRequests from "../pages/admin/ServiceRequests";
import Settings from "../pages/admin/Settings";
import UserManagement from "../pages/admin/UserManagement";
import VerificationManagement from "../pages/admin/VerificationManagement";
import WorkspaceLayout from "./WorkspaceLayout";

const AnimatedAdminRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="dashboard"
          element={
            <PageTransition>
              <AdminDashboard />
            </PageTransition>
          }
        />
        <Route
          path="users"
          element={
            <PageTransition>
              <UserManagement />
            </PageTransition>
          }
        />
        <Route
          path="service-requests"
          element={
            <PageTransition>
              <ServiceRequests />
            </PageTransition>
          }
        />
        <Route
          path="verifications"
          element={
            <PageTransition>
              <VerificationManagement />
            </PageTransition>
          }
        />
        <Route
          path="analytics"
          element={
            <PageTransition>
              <Analytics />
            </PageTransition>
          }
        />
        <Route
          path="settings"
          element={
            <PageTransition>
              <Settings />
            </PageTransition>
          }
        />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AdminLayout = () => {
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: "HomeIcon",
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: "UsersIcon",
    },
    {
      name: "Service Requests",
      href: "/admin/service-requests",
      icon: "WrenchScrewdriverIcon",
    },
    {
      name: "Verifications",
      href: "/admin/verifications",
      icon: "DocumentTextIcon",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: "ChartBarIcon",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: "CogIcon",
    },
  ];

  return (
    <WorkspaceLayout
      roleLabel="Admin workspace"
      title="Admin dashboard"
      subtitle="Oversee users, service requests, verifications, and analytics."
      navigationItems={navigationItems}
    >
      <AnimatedAdminRoutes />
    </WorkspaceLayout>
  );
};

export default AdminLayout;
