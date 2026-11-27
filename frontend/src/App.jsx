import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import PageTransition from "./components/common/PageTransition";
import PrivateRoute from "./components/common/PrivateRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth pages
import ForgotPassword from "./components/auth/ForgotPassword";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";

// Landing page
import LandingPage from "./pages/common/LandingPage";

// Layout components
import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import MechanicLayout from "./layouts/MechanicLayout";

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  console.log(
    "RoleBasedRedirect - User:",
    user ? `${user.name} (${user.role})` : "None",
  );

  if (!user) {
    console.log("RoleBasedRedirect - No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("RoleBasedRedirect - Redirecting based on role:", user.role);

  switch (user.role) {
    case "customer":
      return <Navigate to="/customer/dashboard" replace />;
    case "mechanic":
      return <Navigate to="/mechanic/dashboard" replace />;
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    default:
      console.log("RoleBasedRedirect - Unknown role, redirecting to login");
      return <Navigate to="/login" replace />;
  }
};

const getRouteTransitionKey = (pathname) => {
  if (pathname === "/customer" || pathname.startsWith("/customer/")) {
    return "customer-workspace";
  }
  if (pathname === "/mechanic" || pathname.startsWith("/mechanic/")) {
    return "mechanic-workspace";
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin-workspace";
  }
  return pathname;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getRouteTransitionKey(location.pathname)}>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PageTransition>
              <LandingPage />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <LoginForm />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <RegisterForm />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />

        {/* Role-based redirect */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Customer routes */}
        <Route
          path="/customer/*"
          element={
            <PrivateRoute roles={["customer"]}>
              <PageTransition>
                <CustomerLayout />
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Mechanic routes */}
        <Route
          path="/mechanic/*"
          element={
            <PrivateRoute roles={["mechanic"]}>
              <PageTransition>
                <MechanicLayout />
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute roles={["admin"]}>
              <PageTransition>
                <AdminLayout />
              </PageTransition>
            </PrivateRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-shell app-surface">
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.03),_transparent_36%),linear-gradient(180deg,_#ffffff_0%,_#f7f8fa_100%)]">
            <AnimatedRoutes />
          </div>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className:
                "shadow-modal rounded-xl border border-hairline bg-white text-secondary-900",
              style: {
                background: "#ffffff",
                color: "#222222",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                boxShadow: "0 12px 16px -4px rgba(36, 36, 36, 0.08)",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#1ba673",
                  secondary: "#ffffff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#d45656",
                  secondary: "#ffffff",
                },
              },
            }}
          />

          {/* Debug component (only in development) */}
          {/* <AuthDebug /> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
