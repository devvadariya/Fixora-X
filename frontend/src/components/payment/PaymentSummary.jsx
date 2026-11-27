import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  CurrencyDollarIcon, 
  ReceiptIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import paymentApi from '../../api/paymentApi';
import { formatCurrency } from '../../utils/helpers';
import QuickPaymentButton from './QuickPaymentButton';
import toast from 'react-hot-toast';

const PaymentSummary = ({ onPaymentSuccess }) => {
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    totalAmount: 0,
    pendingAmount: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentSummary();
  }, []);

  const fetchPaymentSummary = async () => {
    try {
      setLoading(true);
      
      // Fetch payment history for summary
      const response = await paymentApi.getPaymentHistory({
        limit: 5,
        page: 1
      });

      if (response.success) {
        const payments = response.data.items || [];
        setRecentPayments(payments);

        // Calculate stats
        const stats = {
          totalPayments: payments.length,
          successfulPayments: payments.filter(p => p.status === 'success').length,
          pendingPayments: payments.filter(p => p.status === 'pending').length,
          totalAmount: payments
            .filter(p => p.status === 'success')
            .reduce((sum, p) => sum + p.amount, 0),
          pendingAmount: payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0)
        };

        setPaymentStats(stats);
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      toast.error('Failed to load payment summary');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment completed successfully!');
    fetchPaymentSummary(); // Refresh summary
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-hairline-soft rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-hairline-soft rounded"></div>
            <div className="h-3 bg-hairline-soft rounded w-5/6"></div>
            <div className="h-3 bg-hairline-soft rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-ink">Payment Summary</h3>
          <p className="text-sm text-secondary-600">Your payment activity overview</p>
        </div>
        <ReceiptIcon className="h-6 w-6 text-primary-600" />
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-lg mx-auto mb-2">
            <CheckCircleIcon className="h-6 w-6 text-success-700" />
          </div>
          <p className="text-2xl font-bold text-ink">{paymentStats.successfulPayments}</p>
          <p className="text-xs text-secondary-600">Successful</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-lg mx-auto mb-2">
            <ClockIcon className="h-6 w-6 text-warning-700" />
          </div>
          <p className="text-2xl font-bold text-ink">{paymentStats.pendingPayments}</p>
          <p className="text-xs text-secondary-600">Pending</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-2">
            <CurrencyDollarIcon className="h-6 w-6 text-primary-900" />
          </div>
          <p className="text-lg font-bold text-ink">{formatCurrency(paymentStats.totalAmount)}</p>
          <p className="text-xs text-secondary-600">Total Paid</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-danger-50 rounded-lg mx-auto mb-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-danger-700" />
          </div>
          <p className="text-lg font-bold text-ink">{formatCurrency(paymentStats.pendingAmount)}</p>
          <p className="text-xs text-secondary-600">Pending</p>
        </div>
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-ink mb-3">Recent Payments</h4>
          <div className="space-y-3">
            {recentPayments.slice(0, 3).map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    payment.status === 'success' ? 'bg-success-50' :
                    payment.status === 'pending' ? 'bg-warning-50' :
                    'bg-danger-50'
                  }`}>
                    <CreditCardIcon className={`h-4 w-4 ${
                      payment.status === 'success' ? 'text-success-700' :
                      payment.status === 'pending' ? 'text-warning-700' :
                      'text-danger-700'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {payment.serviceRequest?.issueType?.replace('_', ' ') || 'Service Payment'}
                    </p>
                    <p className="text-xs text-secondary-600">
                      {payment.status === 'success' ? 'Completed' :
                       payment.status === 'pending' ? 'Pending' : 'Failed'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">
                    {formatCurrency(payment.amount)}
                  </p>
                  {payment.status === 'pending' && (
                    <QuickPaymentButton
                      serviceRequest={payment.serviceRequest}
                      amount={payment.amount}
                      variant="primary"
                      size="xs"
                      onPaymentSuccess={handlePaymentSuccess}
                    >
                      Pay
                    </QuickPaymentButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-hairline">
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.href = '/customer/payments'}
            className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            View All Payments
          </button>
          <button
            onClick={() => window.location.href = '/customer/requests?status=completed'}
            className="flex-1 px-4 py-2 text-sm font-medium text-secondary-600 bg-surface rounded-lg hover:bg-surface transition-colors"
          >
            Pending Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
