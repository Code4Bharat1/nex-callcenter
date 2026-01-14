import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import './Usage.css';

const Usage = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shop = shopProp || searchParams.get('shop');
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTestShop, setIsTestShop] = useState(false);

  useEffect(() => {
    if (shop) {
      loadUsageData();
      checkTestShop();
    }
  }, [shop]);

  const checkTestShop = async () => {
    if (!shop) return;
    try {
      const balanceData = await api.getShopBalance(shop);
      if (balanceData.success && balanceData.data) {
        // Backend now includes isTestShop flag in balance response
        setIsTestShop(balanceData.data.isTestShop === true);
      }
    } catch (e) {
      console.error('Error checking shop:', e);
      setIsTestShop(false);
    }
  };

  const loadUsageData = async () => {
    if (!shop) return;

    try {
      setLoading(true);
      const data = await api.getUsageData(shop);
      
      if (data.success && data.data) {
        setUsageData(data.data);
      } else {
        setUsageData({
          totalSeconds: 0,
          totalAmount: 0,
          dailyData: []
        });
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
      setUsageData({
        totalSeconds: 0,
        totalAmount: 0,
        dailyData: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!shop) return;
    try {
      await api.exportUsageData(shop);
    } catch (error) {
      console.error('Error exporting usage data:', error);
      alert('Failed to export usage data: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[istDate.getMonth()];
    const day = istDate.getDate();
    let hours = istDate.getHours();
    const minutes = istDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day} ${hours}:${minutes}${ampm}`;
  };

  if (!shop) {
    return (
      <div className="usage-page">
        <div className="error-message">No shop parameter found. Please select a shop.</div>
      </div>
    );
  }

  return (
    <div className="usage-page">
      {isTestShop && (
        <div className="blur-overlay">
          <div className="overlay-content">
            <h2>Connect Your Shopify Store</h2>
            <p>Connect your store to view usage and billing information.</p>
            <button className="connect-btn" onClick={() => navigate('/integrations')}>
              Connect to Shopify
            </button>
          </div>
        </div>
      )}

      <div className="usage-header">
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="refresh-btn" onClick={loadUsageData} disabled={loading}>
            <span>🔄</span>
            Refresh Data
          </button>
          <button className="refresh-btn" onClick={handleExport} style={{ background: '#ff6b35' }}>
            <span>📊</span>
            Export Usage Data
          </button>
        </div>
      </div>

      <div className="total-summary">
        <h2>Total Usage & Billing</h2>
        <div className="total-stats">
          <div className="total-stat">
            <div className="total-stat-value">
              {loading ? '-' : (usageData?.totalSeconds || 0).toLocaleString()}
            </div>
            <div className="total-stat-label">Total Seconds Used</div>
          </div>
          <div className="total-stat">
            <div className="total-stat-value">
              {loading ? '₹-' : `₹${(usageData?.totalAmount || 0).toFixed(2)}`}
            </div>
            <div className="total-stat-label">Total Amount Billed</div>
          </div>
        </div>
      </div>

      <div className="daily-breakdown">
        <h3 className="section-title">Daily Breakdown</h3>
        <div className="daily-content">
          {loading ? (
            <div className="loading">
              <Loading size="medium" text="Loading daily usage data..." />
            </div>
          ) : !usageData || !usageData.dailyData || usageData.dailyData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div>No usage data available</div>
            </div>
          ) : (
            <table className="daily-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Seconds Used</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {usageData.dailyData.map((day, idx) => (
                  <tr key={idx}>
                    <td>
                      <a href={`/call-history?shop=${encodeURIComponent(shop)}&date=${day.date}`} className="date-link">
                        {day.date}
                      </a>
                    </td>
                    <td className="seconds-cell">{day.seconds || 0}</td>
                    <td className="amount-cell">₹{(day.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Usage;


