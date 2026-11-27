import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail, validateRequired } from "../../utils/helpers";
import Button from "../common/Button";
import Input from "../common/Input";
import AuthShell from "./AuthShell";
import OTPModal from "./OTPModal";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, tempEmail, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Monitor authentication state changes and redirect
  useEffect(() => {
    console.log("LoginForm useEffect - Auth state:", {
      isAuthenticated,
      user: user ? `${user.name} (${user.role})` : "None",
      showOTPModal,
      localStorage: {
        accessToken: localStorage.getItem("accessToken")
          ? "Present"
          : "Missing",
        user: localStorage.getItem("user") ? "Present" : "Missing",
      },
    });

    if (isAuthenticated && user && !showOTPModal) {
      console.log("User authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, showOTPModal, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateRequired(formData.password, "Password");
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      console.log("Attempting login...");
      const result = await login(formData.email, formData.password);
      console.log("Login result:", result);

      if (result.requiresOTP) {
        console.log("OTP required, showing modal");
        setShowOTPModal(true);
      }
      // If no OTP required, the useEffect will handle the redirect
    } catch (error) {
      console.error("Login error:", error);
      // Error is handled by the context
    }
  };

  // Handle OTP success
  const handleOTPSuccess = () => {
    console.log("OTP verification successful");
    setShowOTPModal(false);
    // The useEffect will handle the redirect
  };

  return (
    <AuthShell
      eyebrow="Member access"
      title="Sign in to a calmer roadside workflow."
      description="Use your account to track requests, resume conversations, and move through the platform without losing context."
      panelStats={[
        { value: "24/7", label: "support" },
        { value: "3", label: "demo accounts" },
      ]}
      panelTitle="Need an account?"
      panelDescription="Customer, mechanic, and admin access now share the same visual system and clearer sign-in hierarchy."
      footerLink={
        <span>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-primary-900 underline-offset-4 hover:underline"
          >
            Create your account
          </Link>
        </span>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            helperText="Use the same email you registered with."
            placeholder="Enter your email"
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              helperText="Password is hidden by default."
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 mt-6 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-secondary-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-secondary-600">
            Forgot your password?{" "}
            <Link
              to="/forgot-password"
              className="font-medium text-primary-900 underline-offset-4 hover:underline"
            >
              Reset it here
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={loading}
          fullWidth
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="rounded-2xl border border-hairline bg-surface px-4 py-4 text-sm text-secondary-600">
          <p className="font-semibold text-primary-900">Demo accounts</p>
          <div className="mt-2 space-y-1 text-xs leading-6">
            <p>
              <strong>Customer:</strong> demouser@fixorax.com / Demo123!
            </p>
            <p>
              <strong>Mechanic:</strong> demomech@fixorax.com / DemoMac123!
            </p>
            <p>
              <strong>Admin:</strong> admin@fixorax.com / Admin123!
            </p>
          </div>
        </div>
      </form>

      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          email={tempEmail || formData.email}
          onSuccess={handleOTPSuccess}
          type="login"
        />
      )}
    </AuthShell>
  );
};

export default LoginForm;
