import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './Pricing.css';

const Pricing = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shopPlan, setShopPlan] = useState('base');
  
  // Calculator state
  const [channels, setChannels] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userChannels');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [shiftTime, setShiftTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userShiftTime');
      return saved ? parseInt(saved) : 8;
    }
    return 8;
  });
  const [talkTime, setTalkTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userTalkTime');
      return saved ? parseInt(saved) : 120;
    }
    return 120;
  });

  useEffect(() => {
    if (shop) {
      loadBillingData();
    }
  }, [shop]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const response = await window.fetch(`/api/billing-data?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setBillingData(data.data);
      }
      
      // Load shop plan
      const balanceResponse = await window.fetch(`/api/shop-balance?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const balanceData = await balanceResponse.json();
      if (balanceData.success && balanceData.data && balanceData.data.plan) {
        setShopPlan(balanceData.data.plan);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-container">
        <div className="pricing-header">
          <h1 className="pricing-title">Plan</h1>
          <p className="pricing-subtitle">Manage your plan and calculate orders capacity</p>
        </div>

        {/* Current Plan Display */}
        <div className="current-plan-section">
          <h2 className="current-plan-title">Current Plan</h2>
          <div className={`plan-banner ${shopPlan === 'premium' ? 'premium' : 'base'}`}>
            <div className="plan-banner-content">
              <div className="plan-banner-text">
                <span className="plan-banner-label">{shopPlan === 'premium' ? 'Premium Plan' : 'Base Plan'}</span>
                <span className="plan-banner-description">
                  {shopPlan === 'premium' 
                    ? 'Enjoy all premium features and priority support' 
                    : 'Upgrade to Premium for advanced features and priority support'}
                </span>
              </div>
              {shopPlan === 'base' && (
                <button className="plan-upgrade-btn">
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calculate Pricing Section */}
        <div className="calculate-pricing-section">
          <h2 className="calculate-pricing-title">Calculate Pricing</h2>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3 className="pricing-card-title">Per Second</h3>
            <div className="pricing-card-prices">
              <div className="pricing-primary-price">
                <span className="pricing-amount">₹0.083</span>
                <span className="pricing-unit">per second</span>
              </div>
              <div className="pricing-secondary-price">
                <span className="pricing-amount-secondary">₹5.00</span>
                <span className="pricing-unit-secondary">per minute</span>
              </div>
            </div>
            <p className="pricing-card-description">
              Pay only for the time you use. Charges are calculated per second for precise billing.
            </p>
          </div>

          <div className="pricing-card">
            <h3 className="pricing-card-title">Channel Cost</h3>
            <div className="pricing-card-prices">
              <div className="pricing-primary-price">
                <span className="pricing-amount">₹1,500</span>
                <span className="pricing-unit">per channel</span>
              </div>
            </div>
            <p className="pricing-card-description">
              Eg. 5 Channels = Able to initiate 5 calls at the same time.
            </p>
          </div>
        </div>

        {/* Cost Calculator */}
        <div className="cost-calculator-section">
          <div className="cost-calculator-header">
            <div className="cost-calculator-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3H7C5.89543 3 5 3.89543 5 5V7M19 7V5C19 3.89543 18.1046 3 17 3H15" stroke="#4b5cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 21H17C18.1046 21 19 20.1046 19 19V17M5 17V19C5 20.1046 5.89543 21 7 21H9" stroke="#4b5cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8C12 8 12 10 10 10C8 10 8 8 8 8V6C8 4.89543 8.89543 4 10 4C11.1046 4 12 4.89543 12 6V8Z" fill="#4b5cff" fillOpacity="0.3"/>
                <path d="M12 16C12 16 12 14 14 14C16 14 16 16 16 16V18C16 19.1046 15.1046 20 14 20C12.8954 20 12 19.1046 12 18V16Z" fill="#4b5cff" fillOpacity="0.3"/>
                <path d="M8 12C8 12 10 12 10 10C10 8 8 8 8 8H6C4.89543 8 4 8.89543 4 10C4 11.1046 4.89543 12 6 12H8Z" fill="#4b5cff" fillOpacity="0.3"/>
                <path d="M16 12C16 12 14 12 14 14C14 16 16 16 16 16H18C19.1046 16 20 15.1046 20 14C20 12.8954 19.1046 12 18 12H16Z" fill="#4b5cff" fillOpacity="0.3"/>
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#4b5cff" fillOpacity="0.2" stroke="#4b5cff" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="cost-calculator-header-text">
              <h3 className="cost-calculator-title">Calculate Your Cost</h3>
              <p className="cost-calculator-subtitle">
                Use our calculator to get a transparent breakdown based on your call volume and usage needs.
              </p>
            </div>
          </div>

          <div className="cost-calculator-content">
            {/* Left Section - Inputs */}
            <div className="cost-calculator-inputs">
              {/* Channels */}
              <div className="cost-calculator-input-group">
                <label className="cost-calculator-label">How many channels?</label>
                <div className="cost-calculator-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    value={channels}
                    onChange={(e) => {
                      const newChannels = Math.max(1, parseInt(e.target.value) || 1);
                      setChannels(newChannels);
                      localStorage.setItem('userChannels', newChannels.toString());
                    }}
                    className="cost-calculator-input"
                  />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={channels}
                    onChange={(e) => {
                      const newChannels = parseInt(e.target.value);
                      setChannels(newChannels);
                      localStorage.setItem('userChannels', newChannels.toString());
                    }}
                    className="cost-calculator-slider"
                  />
                </div>
              </div>

              {/* Shift Time */}
              <div className="cost-calculator-input-group">
                <label className="cost-calculator-label">Shift Time (hours per day)</label>
                <div className="cost-calculator-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={shiftTime}
                    onChange={(e) => {
                      const newShiftTime = Math.max(1, Math.min(24, parseInt(e.target.value) || 8));
                      setShiftTime(newShiftTime);
                      localStorage.setItem('userShiftTime', newShiftTime.toString());
                    }}
                    className="cost-calculator-input"
                  />
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={shiftTime}
                    onChange={(e) => {
                      const newShiftTime = parseInt(e.target.value);
                      setShiftTime(newShiftTime);
                      localStorage.setItem('userShiftTime', newShiftTime.toString());
                    }}
                    className="cost-calculator-slider"
                  />
                </div>
              </div>

              {/* Talk Time */}
              <div className="cost-calculator-input-group">
                <label className="cost-calculator-label">Talk Time (seconds per call)</label>
                <div className="cost-calculator-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={talkTime}
                    onChange={(e) => {
                      const newTalkTime = Math.max(1, Math.min(600, parseInt(e.target.value) || 120));
                      setTalkTime(newTalkTime);
                      localStorage.setItem('userTalkTime', newTalkTime.toString());
                    }}
                    className="cost-calculator-input"
                  />
                  <input
                    type="range"
                    min="30"
                    max="600"
                    step="15"
                    value={talkTime}
                    onChange={(e) => {
                      const newTalkTime = parseInt(e.target.value);
                      setTalkTime(newTalkTime);
                      localStorage.setItem('userTalkTime', newTalkTime.toString());
                    }}
                    className="cost-calculator-slider"
                  />
                </div>
                <div className="cost-calculator-hint">45 seconds buffer included automatically</div>
              </div>
            </div>

            {/* Right Section - Cost Display */}
            <div className="cost-calculator-display">
              <div className="cost-calculator-display-label">ORDERS/DAY LIMIT</div>
              <div className="cost-calculator-display-value">
                {(() => {
                  const totalSecondsPerCall = talkTime + 45;
                  const totalSecondsInShift = shiftTime * 3600;
                  const callsPerChannelPerDay = Math.floor(totalSecondsInShift / totalSecondsPerCall);
                  const ordersPerDay = channels * callsPerChannelPerDay;
                  return ordersPerDay.toLocaleString();
                })()}
              </div>
              <div className="cost-calculator-display-unit">Orders/day</div>
              <div className="cost-calculator-display-details">
                {channels} channel{channels !== 1 ? 's' : ''} × {shiftTime} hour{shiftTime !== 1 ? 's' : ''}/day
                <br />
                {(talkTime + 45).toLocaleString()}s per call
              </div>
            </div>
          </div>
        </div>

        <div className="billing-info-note">
          <div className="billing-info-content">
            <h4 className="billing-info-title">Billing Information</h4>
            <p className="billing-info-text">
              All charges are calculated in real-time based on your usage. You can monitor your spending 
              in the <span className="billing-info-highlight">Usage</span> page. Invoices are generated monthly and 
              can be downloaded from your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;


