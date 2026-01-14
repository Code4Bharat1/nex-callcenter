import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await fetch('/api/password-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setSuccessMessage('OTP sent to your email. Please check your inbox.');
        setError('');
        // In development, show OTP in console/alert for testing
        if (data.otp) {
          console.log('OTP (dev only):', data.otp);
          alert(`OTP sent! (Dev mode) Your OTP is: ${data.otp}`);
        }
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while sending OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otp || !otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordReset(true);
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setError('');
        setTimeout(() => {
          navigate('/login?message=' + encodeURIComponent('Password reset successful! Please login with your new password.'));
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel - Forgot Password Form */}
      <div className="login-left-panel">
        <div className="login-form-wrapper">
          <div className="login-form-container">
            <div className="login-header">
              <p className="login-subtitle">Reset Your Password</p>
              <h1 className="login-title">Forgot Password</h1>
            </div>

            {error && (
              <div className="login-error-message">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="register-success-message" style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #c3e6cb'
              }}>
                {successMessage}
              </div>
            )}

            {!passwordReset ? (
              !otpSent ? (
                <form onSubmit={handleSendOtp} className="login-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSendingOtp || !email.trim()}
                  >
                    {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="login-form">
                  <div className="form-group">
                    <label htmlFor="otp">OTP Verification</label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP from your email"
                      required
                      maxLength={6}
                      autoComplete="one-time-code"
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || !otp.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="btn-link"
                    style={{ marginTop: '12px', fontSize: '14px', textDecoration: 'underline' }}
                  >
                    Resend OTP
                  </button>
                </form>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '16px', color: '#10b981', marginBottom: '20px' }}>
                  ✅ Password reset successfully!
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Redirecting to login page...
                </p>
              </div>
            )}

            {/* Footer Links */}
            <div className="login-footer">
              <p>
                Remember your password? <a href="/login">Login here</a>
              </p>
              <p style={{ marginTop: '8px' }}>
                Don't have an account? <a href="/register">Sign up here</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Background Image */}
      <div className="login-right-panel">
        <div className="login-background-image"></div>
        <div className="login-image-top-content">
          <div className="login-image-logo-section">
            <span className="login-image-logo-text">Scalysis</span>
          </div>
          <p className="login-image-tagline">
            Get access to number 1 Voice Agents, Brain & Phonetics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

