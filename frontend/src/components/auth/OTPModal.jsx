import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../common/Button";

const OTPModal = ({ isOpen, onClose, email, onSuccess, type = "login" }) => {
  const { verifyOTP, verifyRegistrationOTP, resendOTP, loading, error } =
    useAuth();
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Timer for resend OTP
  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOtpValues(["", "", "", "", "", ""]);
      setTimeLeft(60);
      setCanResend(false);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle OTP input change
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedNumbers = pastedData.replace(/\D/g, "").slice(0, 6);

    if (pastedNumbers.length === 6) {
      setOtpValues(pastedNumbers.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otp = otpValues.join("");

    if (otp.length !== 6) {
      return;
    }

    try {
      if (type === "login") {
        await verifyOTP(email, otp);
      } else {
        await verifyRegistrationOTP(email, otp);
      }
      onSuccess();
    } catch (error) {
      // Error handled by context
      // Clear OTP inputs
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      setTimeLeft(60);
      setCanResend(false);
    } catch (error) {
      // Error handled by context
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:px-6">
        <div
          className="fixed inset-0 bg-primary-900/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-hairline bg-white text-left shadow-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-dialog-title"
        >
          <div className="flex items-start justify-between border-b border-hairline px-6 py-5 sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary-500">
                Verification code
              </p>
              <h3
                id="otp-dialog-title"
                className="mt-2 text-2xl font-semibold tracking-tight text-primary-900"
              >
                Verify your account
              </h3>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-secondary-500 transition-colors hover:border-secondary-400 hover:text-primary-900"
              aria-label="Close verification dialog"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7">
            <p className="text-sm leading-7 text-secondary-600">
              We sent a 6-digit verification code to{" "}
              <span className="font-medium text-primary-900">{email}</span>.
            </p>

            <div className="grid grid-cols-6 gap-3">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={value}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-14 rounded-2xl border border-hairline bg-surface text-center text-lg font-semibold text-primary-900 outline-none transition-colors focus:border-primary-900 focus-visible:ring-2 focus:ring-primary-900/10"
                />
              ))}
            </div>

            {error && (
              <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <div className="text-center text-sm text-secondary-500">
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  className="font-medium text-primary-900 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  Resend code
                </button>
              ) : (
                <p>Resend code in {timeLeft}s</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyOTP}
                loading={loading}
                disabled={loading || otpValues.join("").length !== 6}
                fullWidth
              >
                Verify code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
