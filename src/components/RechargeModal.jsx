import React, { useState } from 'react';

const RechargeModal = ({ shop, onClose }) => {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const quickAmounts = [100, 250, 500, 1000];

  const closeModal = () => {
    if (onClose) onClose();
  };

  const setQuickAmount = (val) => {
    setAmount(val);
  };

  const initiatePayment = async () => {
    if (!amount || amount < 1 || amount > 99999) {
      setError('Please enter a valid amount (₹1 - ₹99,999)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/easebuzz/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: shop,
          amount: amount.toFixed(2)
        })
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        setSuccess(true);
        window.open(data.paymentUrl, '_blank');
        setTimeout(() => {
          closeModal();
          window.location.reload();
        }, 3000);
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={closeModal}>
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6B7280'
          }}
        >
          ×
        </button>

        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
          Recharge Wallet
        </h3>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>Payment Initiated!</h4>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
              Completing payment in new window...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Enter Amount (₹)
              </label>
              <input
                type="number"
                min="10"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                Minimum: ₹1 | Maximum: ₹99,999
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setQuickAmount(amt)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    background: amount === amt ? '#4B5CFF' : 'white',
                    color: amount === amt ? 'white' : '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ 
                background: '#FEE2E2', 
                color: '#DC2626', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#6B7280', marginBottom: '12px' }}>Processing payment...</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Do not close this window</div>
              </div>
            ) : (
              <button
                onClick={initiatePayment}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#4B5CFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Pay ₹{amount}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RechargeModal;
