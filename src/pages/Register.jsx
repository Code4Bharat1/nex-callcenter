import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [callingVolume, setCallingVolume] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [enableInternetAccess, setEnableInternetAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');

  // Validate website URL
  const validateWebsite = (url) => {
    if (!url || !url.trim()) {
      return { valid: false, error: 'Company website is required' };
    }
    
    let websiteUrl = url.trim();
    
    // Add protocol if missing
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = 'https://' + websiteUrl;
    }
    
    // Basic URL validation
    try {
      const urlObj = new URL(websiteUrl);
      // Check if it's a valid domain (has at least one dot and valid TLD)
      const hostname = urlObj.hostname;
      if (!hostname.includes('.') || hostname.split('.').length < 2) {
        return { valid: false, error: 'Please enter a valid website URL' };
      }
      return { valid: true, url: websiteUrl };
    } catch (e) {
      return { valid: false, error: 'Please enter a valid website URL' };
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all required fields
    if (!name || !name.trim()) {
      setError('Full name is required');
      return;
    }
    
    const websiteValidation = validateWebsite(companyWebsite);
    if (!websiteValidation.valid) {
      setError(websiteValidation.error);
      return;
    }
    
    if (!email || !email.trim()) {
      setError('Email is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!phone || !phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    
    if (!callingVolume) {
      setError('Please select calling volume per day');
      return;
    }
    
    setIsSendingOtp(true);
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          companyWebsite: websiteValidation.url,
          phone: phoneDigits,
          callingVolume: callingVolume,
          enableInternetAccess: enableInternetAccess,
          password: password
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setOtpSent(true);
        setError('');
        setSuccessMessage('Sent On Mail');
        // In development, show OTP in console/alert for testing
        if (data.otp) {
          console.log('OTP (dev only):', data.otp);
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!otp || !otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsVerifyingOtp(true);
    
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setOtpVerified(true);
        setSuccessMessage('OTP verified! Please create a password.');
        setError('');
      } else {
        setError(data.error || 'Wrong OTP. Please enter again.');
        setOtp('');
      }
    } catch (err) {
      setError('An error occurred while verifying OTP. Please try again.');
      setOtp('');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validate required fields
    if (!email || !email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    
    if (!otpVerified) {
      setError('Please verify OTP first');
      setIsLoading(false);
      return;
    }

    // Basic password validation (min 6 characters)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    // Phone number validation (exactly 10 digits)
    const phoneDigits = phone.replace(/\D/g, ''); // Remove all non-digit characters
    if (!phone || !phone.trim()) {
      setError('Phone number is required');
      setIsLoading(false);
      return;
    }
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      setIsLoading(false);
      return;
    }

    try {
      // Use URLSearchParams for better compatibility with express.urlencoded
      const params = new URLSearchParams();
      params.append('name', name || '');
      params.append('email', email || '');
      params.append('phone', phoneDigits);
      params.append('companyWebsite', companyWebsite || '');
      params.append('callingVolume', callingVolume || '');
      params.append('enableInternetAccess', enableInternetAccess ? 'true' : 'false');
      params.append('password', password || '');
      params.append('otp', otp || '');

      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Redirect to login page after successful registration
          const redirectUrl = data.redirect || '/login';
          window.location.href = redirectUrl + '?message=' + encodeURIComponent('Registration successful! Please login.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
      } else {
        const data = await response.json().catch(() => ({ error: 'Registration failed. Please try again.' }));
        if (data.error) {
          setError(data.error);
        } else if (data.error?.includes('exists')) {
          setError('User already exists. Please login instead.');
        } else if (data.error?.includes('OTP')) {
          setError('Invalid or expired OTP. Please request a new one.');
          setOtpSent(false);
          setOtpVerified(false);
          setOtp('');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="register-page">
      {/* Right Panel - Background Video with Text Overlay */}
      <div className="register-right-panel">
        {/* Background Video */}
        <video 
          className="register-background-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/images/61a49666698fe8881f724f27e0fcdf21.mp4" type="video/mp4" />
        </video>
        
        {/* Top Left - Logo */}
        <div className="register-image-top-content">
          <div className="register-image-logo-section">
            <span className="register-image-logo-text">Scalysis</span>
          </div>
        </div>
        
        {/* Bottom - Tagline */}
        <div className="register-image-bottom-tagline">
          <p className="register-image-tagline" style={{ marginBottom: '24px' }}>
            Get access to number 1 Voice Agents, Brain & Phonetics.
          </p>
          
          {/* Partners & Integrations */}
          <div style={{ marginTop: '32px' }}>
            <p style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '16px',
              textAlign: 'center',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              Partners & Integrations
            </p>
            <div className="register-partners-marquee-wrapper">
              <div className="register-partners-marquee-content">
                {/* First set of logos */}
                <img src="/partners/67e1f3f19293df9d39969e26_cartesia-logo.svg" alt="Cartesia" className="register-partner-logo" />
                <img src="/partners/Bharti_Airtel_Logo.svg.png" alt="Airtel" className="register-partner-logo" />
                <img src="/partners/elevenlabs-logo-white.png" alt="ElevenLabs" className="register-partner-logo" />
                <img src="/partners/OpenAI_Logo.svg.png" alt="OpenAI" className="register-partner-logo" />
                <img src="/partners/Jio-Emblem.png" alt="Jio" className="register-partner-logo" />
                <img src="/partners/sarvam-ai-logo-hd2.webp" alt="Sarvam AI" className="register-partner-logo" />
                {/* Duplicate for seamless loop */}
                <img src="/partners/67e1f3f19293df9d39969e26_cartesia-logo.svg" alt="Cartesia" className="register-partner-logo" />
                <img src="/partners/Bharti_Airtel_Logo.svg.png" alt="Airtel" className="register-partner-logo" />
                <img src="/partners/elevenlabs-logo-white.png" alt="ElevenLabs" className="register-partner-logo" />
                <img src="/partners/OpenAI_Logo.svg.png" alt="OpenAI" className="register-partner-logo" />
                <img src="/partners/Jio-Emblem.png" alt="Jio" className="register-partner-logo" />
                <img src="/partners/sarvam-ai-logo-hd2.webp" alt="Sarvam AI" className="register-partner-logo" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Panel - Register Form */}
      <div className="register-left-panel">
        <div className="register-form-wrapper">
          {/* Form Container - Centered */}
          <div className="register-form-container">
            <div className="register-header">
              <h1 className="register-title">Create your account</h1>
              <p className="register-subtitle">Sign up to get started with Scalysis</p>
            </div>

            {error && (
              <div className="register-error-message">
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

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  autoComplete="name"
                  readOnly={otpSent}
                  style={otpSent ? { backgroundColor: '#f5f5f5', cursor: 'default' } : {}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyWebsite">Company Website</label>
                <input
                  type="url"
                  id="companyWebsite"
                  name="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="example.com"
                  required
                  autoComplete="url"
                  readOnly={otpSent}
                  style={otpSent ? { backgroundColor: '#f5f5f5', cursor: 'default' } : {}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  readOnly={otpSent}
                  style={otpSent ? { backgroundColor: '#f5f5f5', cursor: 'default' } : {}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Phone number"
                  autoComplete="tel"
                  required
                  maxLength={10}
                  readOnly={otpSent}
                  style={otpSent ? { backgroundColor: '#f5f5f5', cursor: 'default' } : {}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="callingVolume">Calling Volume Per Day</label>
                <select
                  id="callingVolume"
                  name="callingVolume"
                  value={callingVolume}
                  onChange={(e) => setCallingVolume(e.target.value)}
                  required
                  disabled={otpSent}
                  style={otpSent ? { backgroundColor: '#f5f5f5', cursor: 'default' } : {}}
                >
                  <option value="">Select calling volume</option>
                  <option value="0-100">0-100</option>
                  <option value="100-500">100-500</option>
                  <option value="500-1500">500-1500</option>
                  <option value="1500-4000">1500-4000</option>
                  <option value="4000+">4000+</option>
                </select>
              </div>

              {/* Enable Internet Access Toggle */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                  <div>
                    <label htmlFor="enableInternetAccess" style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontWeight: 400,
                      color: '#1D1D1F',
                      fontSize: '13px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
                      letterSpacing: '-0.01em',
                      cursor: otpSent ? 'default' : 'pointer'
                    }}>
                      Enable Internet Access
                    </label>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#6b7280',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
                      letterSpacing: '-0.01em'
                    }}>
                      Able to pull up real time information from the internet, keeping it up to date
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '28px',
                    cursor: otpSent ? 'not-allowed' : 'pointer',
                    opacity: otpSent ? 0.5 : 1
                  }}>
                    <input
                      type="checkbox"
                      id="enableInternetAccess"
                      checked={enableInternetAccess}
                      onChange={(e) => !otpSent && setEnableInternetAccess(e.target.checked)}
                      disabled={otpSent}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: enableInternetAccess ? '#1D1D1F' : '#e1e5e9',
                      borderRadius: '28px',
                      transition: 'all 0.3s ease',
                      boxShadow: enableInternetAccess ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '22px',
                        width: '22px',
                        left: enableInternetAccess ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {!otpSent ? (
                <button 
                  type="button"
                  onClick={handleSendOtp}
                  className="btn-primary"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  {/* Show "Sent On Mail" message */}
                  {successMessage && (
                    <div className="register-success-message" style={{
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid #c3e6cb',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
                    }}>
                      {successMessage}
                    </div>
                  )}

                  {!otpVerified ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="otp">Enter OTP</label>
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          required
                          maxLength={6}
                          autoComplete="one-time-code"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                            setOtpVerified(false);
                            setError('');
                            setSuccessMessage('');
                          }}
                          className="btn-link"
                          style={{ marginTop: '8px', fontSize: '14px', textDecoration: 'underline', color: '#1D1D1F' }}
                        >
                          Resend OTP
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={handleVerifyOtp}
                        className="btn-primary"
                        disabled={isVerifyingOtp || !otp.trim() || otp.length !== 6}
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4806 9.80385 14.1958C9.51897 13.9109 9.29391 13.5715 9.14301 13.198C8.99211 12.8245 8.91802 12.4243 8.92512 12.0215C8.93223 11.6187 9.02041 11.2214 9.1844 10.8534C9.34839 10.4855 9.58479 10.1541 9.87963 9.87963" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isLoading || !password.trim()}
                      >
                        {isLoading ? 'Signing Up...' : 'Login'}
                      </button>
                    </>
                  )}
                </>
              )}
            </form>

            {/* Footer Links */}
            <div className="register-footer">
              <p className="register-footer-text">
                Already have an account? <a href="/login" className="register-footer-link">Sign in</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

