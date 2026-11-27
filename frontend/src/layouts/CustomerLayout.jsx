import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageTransition from "../components/common/PageTransition";

import WorkspaceLayout from "./WorkspaceLayout";
import BookService from "../pages/customer/BookService";
import Chat from "../pages/customer/Chat";
import CustomerDashboard from "../pages/customer/Dashboard";
import MechanicDiscovery from "../pages/customer/MechanicDiscovery";
import PaymentHistory from "../pages/customer/PaymentHistory";
import Profile from "../pages/customer/Profile";
import RequestHistory from "../pages/customer/RequestHistory";

const AnimatedCustomerRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="dashboard"
          element={
            <PageTransition>
              <CustomerDashboard />
            </PageTransition>
          }
        />
        <Route
          path="mechanics"
          element={
            <PageTransition>
              <MechanicDiscovery />
            </PageTransition>
          }
        />

        <Route
          path="book-service"
          element={
            <PageTransition>
              <BookService />
            </PageTransition>
          }
        />
        <Route
          path="requests"
          element={
            <PageTransition>
              <RequestHistory />
            </PageTransition>
          }
        />
        <Route
          path="payments"
          element={
            <PageTransition>
              <PaymentHistory />
            </PageTransition>
          }
        />
        <Route
          path="chat"
          element={
            <PageTransition>
              <Chat />
            </PageTransition>
          }
        />
        <Route
          path="profile"
          element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }
        />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const CustomerLayout = () => {
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/customer/dashboard",
      icon: "HomeIcon",
    },
    {
      name: "Find Mechanics",
      href: "/customer/mechanics",
      icon: "WrenchScrewdriverIcon",
    },

    {
      name: "Request History",
      href: "/customer/requests",
      icon: "ClockIcon",
    },
    {
      name: "Payments",
      href: "/customer/payments",
      icon: "CreditCardIcon",
    },
    {
      name: "Messages",
      href: "/customer/chat",
      icon: "ChatBubbleLeftIcon",
    },
    {
      name: "Profile",
      href: "/customer/profile",
      icon: "UserIcon",
    },
  ];

  return (
    <WorkspaceLayout
      roleLabel="Customer workspace"
      title="Customer dashboard"
      subtitle="Track requests, payments, mechanics, and messages in one place."
      navigationItems={navigationItems}
    >
      <AnimatedCustomerRoutes />
    </WorkspaceLayout>
  );
};

export default CustomerLayout;
