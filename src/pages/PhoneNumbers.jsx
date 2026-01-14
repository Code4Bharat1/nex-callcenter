import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './PhoneNumbers.css';

const PhoneNumbers = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCalls, setTotalCalls] = useState(0);

  useEffect(() => {
    if (shop) {
      loadPhoneNumbers();
      loadTotalCalls();
    }
  }, [shop]);

  const loadPhoneNumbers = async () => {
    // For now, use hardcoded number - later can fetch from API
    setPhoneNumbers([{
      number: '1913528324',
      category: 'Base',
      country: 'IN'
    }]);
  };

  const loadTotalCalls = async () => {
    if (!shop) return;
    try {
      // Fetch total calls for this shop
      const response = await fetch(`/api/total-calls?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.totalCalls) {
        setTotalCalls(data.totalCalls);
      }
    } catch (error) {
      console.error('Error loading total calls:', error);
    }
  };

  return (
    <div className="phone-numbers-container">
      <div className="phone-numbers-header">
        {/* Title removed - already shown in TopBar */}
        <p className="phone-numbers-subtitle">Your phone numbers for outgoing calls</p>
      </div>

      <div className="phone-numbers-content">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                Phone Number
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                Category
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                Calls Made
              </th>
            </tr>
          </thead>
          <tbody>
            {phoneNumbers.map((phone, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🇮🇳</span>
                    <span style={{ fontWeight: 500, fontSize: '12px', color: '#6B7280' }}>IN</span>
                    <a
                      href={`https://www.truecaller.com/search/in/${phone.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#4B5CFF',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      {phone.number}
                    </a>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#1F2937' }}>
                  {phone.category}
                </td>
                <td style={{ padding: '16px', color: '#1F2937', fontWeight: 500 }}>
                  {totalCalls.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhoneNumbers;

