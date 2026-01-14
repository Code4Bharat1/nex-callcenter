import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InteractiveHoverButton } from '../components/InteractiveHoverButton';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');
  
  // Check for error in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === '1') {
      setError('Incorrect email or password. Please try again.');
      // Clean URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Use traditional form submission to handle server-side redirects properly
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/auth/login';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'hidden';
    emailInput.name = 'email';
    emailInput.value = email;
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'hidden';
    passwordInput.name = 'password';
    passwordInput.value = password;
    
    if (nextUrl) {
      const nextInput = document.createElement('input');
      nextInput.type = 'hidden';
      nextInput.name = 'next';
      nextInput.value = nextUrl;
      form.appendChild(nextInput);
    }
    
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    document.body.appendChild(form);
    form.submit();
  };


  return (
    <div className="login-page">
      {/* Right Panel - Logo Background */}
      <div className="login-right-panel">
        {/* Logo Background */}
        <div className="login-logo-background">
          <img src="/nexcore_logo.png" alt="NexCore" className="login-logo-image" />
        </div>
        
        {/* Top Left - Logo */}
        <div className="login-image-top-content">
          <div className="login-image-logo-section">
            <span className="login-image-logo-text">NexCore</span>
          </div>
        </div>
      </div>

      {/* Left Panel - Login Form */}
      <div className="login-left-panel">
        <div className="login-form-wrapper">
          {/* Form Container - Centered */}
          <div className="login-form-container">
            <div className="login-header">
              <p className="login-subtitle">Continue Your Journey</p>
              <h1 className="login-title">Login into NexCore</h1>
            </div>

            {error && (
              <div className="login-error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
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
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
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

              <InteractiveHoverButton 
                type="submit" 
                disabled={isLoading}
                className={isLoading ? 'interactive-hover-button--loading' : ''}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </InteractiveHoverButton>
            </form>

            {/* Footer Link */}
            <div className="login-footer">
              <p>Don't have an account? <a href="/register">Sign up here</a></p>
              <p style={{ marginTop: '12px', fontSize: '14px' }}>
                <a href="/forgot-password" style={{ color: '#4B5CFF', textDecoration: 'underline' }}>
                  Forgot password? Reset it here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

