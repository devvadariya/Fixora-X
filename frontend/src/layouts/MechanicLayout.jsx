import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageTransition from "../components/common/PageTransition";

import WorkspaceLayout from "./WorkspaceLayout";
import VerificationForm from "../components/mechanic/VerificationForm";
import AssignedRequests from "../pages/mechanic/AssignedRequests";
import Calendar from "../pages/mechanic/Calendar";
import Chat from "../pages/mechanic/Chat";
import MechanicDashboard from "../pages/mechanic/Dashboard";
import Earnings from "../pages/mechanic/Earnings";
import Profile from "../pages/mechanic/Profile";

const AnimatedMechanicRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="dashboard"
          element={
            <PageTransition>
              <MechanicDashboard />
            </PageTransition>
          }
        />
        <Route
          path="requests"
          element={
            <PageTransition>
              <AssignedRequests />
            </PageTransition>
          }
        />
        <Route
          path="calendar"
          element={
            <PageTransition>
              <Calendar />
            </PageTransition>
          }
        />
        <Route
          path="earnings"
          element={
            <PageTransition>
              <Earnings />
            </PageTransition>
          }
        />
        <Route
          path="chat/*"
          element={
            <PageTransition>
              <Chat />
            </PageTransition>
          }
        />
        <Route
          path="verification"
          element={
            <PageTransition>
              <VerificationForm />
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

const MechanicLayout = () => {
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/mechanic/dashboard",
      icon: "HomeIcon",
    },
    {
      name: "Assigned Requests",
      href: "/mechanic/requests",
      icon: "WrenchScrewdriverIcon",
    },
    {
      name: "Calendar",
      href: "/mechanic/calendar",
      icon: "CalendarIcon",
    },
    {
      name: "Earnings",
      href: "/mechanic/earnings",
      icon: "CurrencyDollarIcon",
    },
    {
      name: "Messages",
      href: "/mechanic/chat",
      icon: "ChatBubbleLeftIcon",
    },
    {
      name: "Verification",
      href: "/mechanic/verification",
      icon: "DocumentTextIcon",
    },
    {
      name: "Profile",
      href: "/mechanic/profile",
      icon: "UserIcon",
    },
  ];

  return (
    <WorkspaceLayout
      roleLabel="Mechanic workspace"
      title="Mechanic dashboard"
      subtitle="Manage requests, availability, earnings, and verification."
      navigationItems={navigationItems}
    >
      <AnimatedMechanicRoutes />
    </WorkspaceLayout>
  );
};

export default MechanicLayout;
