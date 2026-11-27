import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../common/Button";
import Input from "../common/Input";
import AuthShell from "./AuthShell";
import OTPModal from "./OTPModal";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

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

  // Validation functions
  const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return "Please enter a valid phone number";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return null;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    const nameError = validateRequired(formData.name, "Name");
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      setTempEmail(formData.email);
      setShowOTPModal(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP success
  const handleOTPSuccess = () => {
    setShowOTPModal(false);
    navigate("/login");
  };

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join the roadside service platform with a cleaner signup flow."
      description="Choose how you want to use Fixora-X, verify your details, and move into the right workspace without losing momentum."
      panelStats={[
        { value: "2", label: "roles" },
        { value: "6", label: "digit otp" },
      ]}
      panelTitle="Role aware onboarding"
      panelDescription="Customers and mechanics share the same registration flow, but the platform still tailors the workspace and downstream experience."
      footerLink={
        <span>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary-900 underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </span>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700">
            Register as
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, role: "customer" }))
              }
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                formData.role === "customer"
                  ? "border-primary-900 bg-surface text-primary-900"
                  : "border-hairline bg-white text-secondary-700 hover:border-secondary-400"
              }`}
            >
              <div className="text-sm font-semibold">Customer</div>
              <div className="mt-1 text-xs leading-6 text-secondary-500">
                Need roadside help
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, role: "mechanic" }))
              }
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                formData.role === "mechanic"
                  ? "border-primary-900 bg-surface text-primary-900"
                  : "border-hairline bg-white text-secondary-700 hover:border-secondary-400"
              }`}
            >
              <div className="text-sm font-semibold">Mechanic</div>
              <div className="mt-1 text-xs leading-6 text-secondary-500">
                Provide services
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Full name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            helperText="Use the name customers or admins will recognize."
            placeholder="Enter your full name"
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            helperText="You’ll verify this email with a one-time code."
            placeholder="Enter your email address"
          />

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            helperText="Include the country code if needed."
            placeholder="Enter your phone number"
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
              helperText="Use at least 8 characters with mixed case and a number."
              placeholder="Create a password"
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

          <div className="relative">
            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              helperText="Repeat the password exactly."
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 mt-6 flex items-center pr-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-secondary-400" />
              )}
            </button>
          </div>
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
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <div className="rounded-2xl border border-hairline bg-surface px-4 py-4 text-xs leading-6 text-secondary-500">
          By creating an account, you agree to our{" "}
          <Link
            to="/terms"
            className="font-medium text-primary-900 underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="font-medium text-primary-900 underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </div>
      </form>

      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          email={tempEmail}
          onSuccess={handleOTPSuccess}
          type="register"
        />
      )}
    </AuthShell>
  );
};

export default RegisterForm;
