import { useState } from "react";
import toast from "react-hot-toast";
import paymentApi from "../../api/paymentApi";
import Button from "../common/Button";

const PaymentTest = () => {
  const [loading, setLoading] = useState(false);
  const [testAmount, setTestAmount] = useState(100);

  const testPayment = async () => {
    try {
      setLoading(true);

      // Create a test payment order
      const response = await paymentApi.createPaymentOrder({
        serviceRequestId: "507f1f77bcf86cd799439011", // Test request ID
        amount: testAmount,
        currency: "INR",
      });

      if (response.success) {
        console.log("Test payment order created:", response.data);
        toast.success("Test payment order created successfully!");

        // Initialize Razorpay payment
        if (window.Razorpay) {
          const options = {
            key: response.data.razorpayKey || "rzp_test_CjxI6ZFqFKX7Xs",
            amount: response.data.amount * 100,
            currency: response.data.currency,
            name: "Fixora-X Test",
            description: "Test payment for Fixora-X",
            order_id: response.data.razorpayOrderId,
            handler: function (paymentResponse) {
              console.log("Test payment successful:", paymentResponse);
              toast.success("Test payment completed!");
            },
            prefill: {
              name: "Test Customer",
              email: "test@example.com",
              contact: "9999999999",
            },
            theme: {
              color: "#0ea5e9",
            },
          };

          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.open();
        } else {
          toast.error("Razorpay SDK not loaded");
        }
      } else {
        toast.error(response.message || "Failed to create test payment");
      }
    } catch (error) {
      console.error("Test payment error:", error);
      toast.error("Test payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-card">
      <h3 className="text-lg font-semibold mb-4">Payment Test</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Test Amount (₹)
          </label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-hairline px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 focus-visible:ring-offset-0 focus:border-primary-900"
            min="1"
            max="10000"
          />
        </div>
        <Button onClick={testPayment} loading={loading} variant="primary">
          Test Payment
        </Button>
      </div>
    </div>
  );
};

export default PaymentTest;
