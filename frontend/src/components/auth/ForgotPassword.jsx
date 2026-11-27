import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/helpers';
import AuthShell from './AuthShell';
import Button from '../common/Button';
import Input from '../common/Input';

const ForgotPassword = () => {
  const { forgotPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  if (success) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Check your inbox."
        description={`We sent password reset instructions to ${email}. Follow the link in that message to finish recovering your account.`}
        panelStats={[
          { value: '60s', label: 'resend delay' },
          { value: '1', label: 'reset path' },
        ]}
        panelTitle="Recovery status"
        panelDescription="The recovery flow now matches the rest of the brand system and stays easy to scan on mobile."
        footerLink={
          <span>
            Need to return to sign-in?{' '}
            <Link to="/login" className="font-medium text-primary-900 underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </span>
        }
      >
        <div className="rounded-3xl border border-success-200 bg-success-50 p-6 text-success-900">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Email sent</p>
          <p className="mt-3 text-sm leading-7 text-success-800">
            We have queued the reset instructions and the message should arrive shortly.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter the email attached to your Fixora-X account and we’ll send a reset link with the next steps."
      panelStats={[
        { value: '1', label: 'reset email' },
        { value: '60s', label: 'retry window' },
      ]}
      panelTitle="What happens next"
      panelDescription="You’ll receive a link to reset your password, then you can sign back in without losing account history."
      footerLink={
        <span>
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary-900 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          name="email"
          type="email"
          required
          value={email}
          onChange={handleEmailChange}
          error={emailError}
          helperText="Use the same email associated with your account."
          placeholder="Enter your email"
        />

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
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
