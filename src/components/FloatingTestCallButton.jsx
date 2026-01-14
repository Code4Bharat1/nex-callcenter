import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCallScripts, getTestOrders, createTestOrder, queueTestOrder, makeTestCall, updateOrderScript, createScript } from '../utils/api';
import './FloatingTestCallButton.css';

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Memoji files array
const MEMOJI_FILES = [
  '/images/1 Happy.svg',
  '/images/2 Happy.svg',
  '/images/3 happy.svg',
  '/images/4 happy.svg',
  '/images/6 happy.svg',
  '/images/Character=Angela, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Darlene, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Jeniffer, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Kim, Skin tone=White, Posture=1 Happy.svg',
];

// Light background colors for memojis
const MEMOJI_BACKGROUNDS = [
  '#F9FFF1', '#FFF9F0', '#F0F9FF', '#F9F0FF', '#FFF0F9',
  '#F0FFF9', '#FFF5F0', '#F5F0FF', '#F0F5FF', '#FFF0F5',
];

// Get memoji and background for an agent (consistent based on agent ID)
const getAgentMemoji = (agentId) => {
  const index = agentId ? (parseInt(agentId) % MEMOJI_FILES.length) : 0;
  const bgIndex = agentId ? (parseInt(agentId) % MEMOJI_BACKGROUNDS.length) : 0;
  return {
    memoji: MEMOJI_FILES[index],
    background: MEMOJI_BACKGROUNDS[bgIndex],
  };
};

const FloatingTestCallButton = ({ shop, isEmbedded = false, onClose }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [testOrders, setTestOrders] = useState([]);
  const [testCallTab, setTestCallTab] = useState('create');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [initiatedCallData, setInitiatedCallData] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [testOrderForm, setTestOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    totalPrice: '',
    currency: 'INR',
    orderNumber: '',
  });

  const selectedAgent = useMemo(() => {
    return agents.find(agent => agent.id.toString() === selectedAgentId);
  }, [agents, selectedAgentId]);

  const selectedAgentMemoji = useMemo(() => {
    return selectedAgent ? getAgentMemoji(selectedAgent.id) : null;
  }, [selectedAgent]);

  // Check if required fields are filled
  const isFormValid = useMemo(() => {
    return (
      testOrderForm.customerName.trim() !== '' &&
      testOrderForm.customerPhone.trim() !== '' &&
      selectedAgentId !== ''
    );
  }, [testOrderForm.customerName, testOrderForm.customerPhone, selectedAgentId]);

  useEffect(() => {
    if (showModal && shop) {
      loadAgents();
    }
  }, [showModal, shop]);

  // When modal opens and agents are loaded, check for default agent ID from sessionStorage
  useEffect(() => {
    if (showModal && agents.length > 0) {
      const defaultAgentId = sessionStorage.getItem('testCallDefaultAgentId');
      if (defaultAgentId) {
        const defaultAgent = agents.find(agent => agent.id.toString() === defaultAgentId);
        if (defaultAgent) {
          setSelectedAgentId(defaultAgent.id.toString());
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('testCallDefaultAgentId');
        } else {
          // Default agent not found, clear it
          sessionStorage.removeItem('testCallDefaultAgentId');
        }
      }
    }
  }, [showModal, agents]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAgentDropdown && !event.target.closest('.agent-selector-wrapper')) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAgentDropdown]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const loadAgents = async () => {
    try {
      const response = await getCallScripts(shop);
      const scripts = response?.scripts || response || [];
      const validAgents = Array.isArray(scripts) ? scripts.filter(agent => agent && agent.id) : [];
      
      // Add template agents
      const templateAgents = [
        {
          id: 'template-test-scalysis-intro-laughter',
          name: 'Test Scalysis Intro (Laughter)',
          description: 'A naturally conversational test agent that sounds human. Perfect for testing how natural AI calling can feel with real conversations.',
          isTemplate: true,
          templateKey: 'test-scalysis-intro-laughter'
        },
        {
          id: 'template-test-scalysis-no-laughter',
          name: 'Test Scalysis (No laughter)',
          description: 'A naturally conversational test agent that sounds human. Perfect for testing how natural AI calling can feel with real conversations.',
          isTemplate: true,
          templateKey: 'test-scalysis-no-laughter'
        }
      ];
      
      // Combine regular agents and template agents
      const allAgents = [...validAgents, ...templateAgents];
      setAgents(allAgents);
      
      // Don't set selectedAgentId here - let the useEffect handle it based on sessionStorage
      if (allAgents.length > 0 && !selectedAgentId) {
        // Only set to first agent if no selection exists and no default from sessionStorage
        const defaultAgentId = sessionStorage.getItem('testCallDefaultAgentId');
        if (!defaultAgentId) {
          setSelectedAgentId(allAgents[0].id.toString());
        }
      }
    } catch (error) {
      console.error('[FloatingTestCall] Error loading agents:', error);
      setAgents([]);
    }
  };

  const loadTestOrders = async () => {
    try {
      const response = await getTestOrders(shop);
      const orders = response?.orders || response || [];
      setTestOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error('[FloatingTestCall] Error loading test orders:', error);
      setTestOrders([]);
    }
  };

  const handleTestOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      alert('Please select an agent first');
      return;
    }

    setIsCalling(true);
    setCallError(null);

    try {
      // Step 1: Create the test order
      const response = await createTestOrder(testOrderForm, shop);
      if (!response.success || !response.order) {
        throw new Error(response.error || 'Failed to create test order');
      }

      // Use database ID (not orderId string) for the test-call API
      const orderId = response.order.id;
      
      if (!orderId) {
        throw new Error('Order created but no ID returned');
      }
      
      // Step 2: Update order's scriptId (without changing callStatus)
      try {
        await updateOrderScript(orderId, parseInt(selectedAgentId), shop);
      } catch (scriptError) {
        console.error('[FloatingTestCall] Error updating order script:', scriptError);
        // Continue anyway - API will check for scriptId
      }

      // Step 3: Call the test-call API directly (instead of queueing)
      try {
        const callResult = await makeTestCall(orderId);
        
        // Show success screen with call results
        setInitiatedCallData({
          agentName: selectedAgent?.name || 'Agent',
          agentMemoji: selectedAgentMemoji,
          phoneNumber: testOrderForm.customerPhone,
          callResult: callResult.call_result || null,
          callStatus: callResult.call_result?.call_status || 'completed',
          callDuration: callResult.call_result?.call_duration || null,
          callOutcome: callResult.call_result?.retry_result?.call_outcome || null,
        });
        setCallInitiated(true);
        // Start 30-second cooldown
        setCooldownSeconds(31);
      } catch (callError) {
        // Handle rate limiting
        if (callError.message.includes('429') || callError.message.includes('Rate limit')) {
          setCallError('Rate limit exceeded. Please wait 1 minute before making another test call.');
        } else {
          setCallError(callError.message || 'Error making test call');
        }
        // Still show success screen but with error info
        setInitiatedCallData({
          agentName: selectedAgent?.name || 'Agent',
          agentMemoji: selectedAgentMemoji,
          phoneNumber: testOrderForm.customerPhone,
          error: callError.message,
        });
        setCallInitiated(true);
        // Start 30-second cooldown even on error
        setCooldownSeconds(31);
      }
    } catch (error) {
      console.error('[FloatingTestCall] Error:', error);
      setCallError(error.message || 'Error creating test order');
      alert(error.message || 'Error creating test order');
    } finally {
      setIsCalling(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
    setShowModal(false);
    setCallInitiated(false);
  };

  const handleCallAnother = () => {
    setCallInitiated(false);
    setInitiatedCallData(null);
    setTestOrderForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      totalPrice: '',
      currency: 'INR',
      orderNumber: '',
    });
    setTestCallTab('create');
    setCallError(null);
  };

  const handleQueueTestOrder = async (orderId) => {
    if (!selectedAgentId) {
      alert('Please select an agent first');
      return;
    }

    setIsCalling(true);
    setCallError(null);

    try {
      // Step 1: Update order's scriptId (without changing callStatus)
      try {
        await updateOrderScript(orderId, parseInt(selectedAgentId), shop);
      } catch (scriptError) {
        console.error('[FloatingTestCall] Error updating order script:', scriptError);
        // Continue anyway - API will check for scriptId
      }

      // Step 2: Call the test-call API directly (instead of queueing)
      try {
        const callResult = await makeTestCall(orderId);
        
        // Show success screen
        const order = testOrders.find(o => (o.id || o.orderId) === orderId);
        setInitiatedCallData({
          agentName: selectedAgent?.name || 'Agent',
          agentMemoji: selectedAgentMemoji,
          phoneNumber: order?.customerPhone || 'N/A',
          callResult: callResult.call_result || null,
          callStatus: callResult.call_result?.call_status || 'completed',
          callDuration: callResult.call_result?.call_duration || null,
          callOutcome: callResult.call_result?.retry_result?.call_outcome || null,
        });
        setCallInitiated(true);
        loadTestOrders();
        // Start 30-second cooldown
        setCooldownSeconds(31);
      } catch (callError) {
        // Handle rate limiting
        if (callError.message.includes('429') || callError.message.includes('Rate limit')) {
          alert('Rate limit exceeded. Please wait 1 minute before making another test call.');
        } else {
          alert(callError.message || 'Error making test call');
        }
        // Start cooldown even on error
        setCooldownSeconds(31);
      }
    } catch (error) {
      console.error('[FloatingTestCall] Error:', error);
      alert(error.message || 'Error making test call');
    } finally {
      setIsCalling(false);
    }
  };

  const handleCreateNewAgent = () => {
    setShowModal(false);
    const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    navigate(`/playground${shopParam}`);
  };

  const handleEditAgent = (agentId, e) => {
    e.stopPropagation();
    setShowModal(false);
    const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    navigate(`/playground${shopParam}#agent-${agentId}`);
  };

  // If embedded, show modal directly and handle close
  React.useEffect(() => {
    if (isEmbedded) {
      setShowModal(true);
    }
  }, [isEmbedded]);

  const handleModalClose = () => {
    setShowModal(false);
    if (isEmbedded && onClose) {
      onClose();
    }
  };

  return (
    <>
      {!isEmbedded && (
        <button
          className="floating-test-call-btn"
          onClick={() => setShowModal(true)}
          title="Test Call"
        >
          <div className="floating-test-call-sound-wave">
            <div className="floating-test-call-sound-bar"></div>
            <div className="floating-test-call-sound-bar"></div>
            <div className="floating-test-call-sound-bar"></div>
            <div className="floating-test-call-sound-bar"></div>
            <div className="floating-test-call-sound-bar"></div>
          </div>
        </button>
      )}

      {showModal && (
        <div
          className="floating-test-call-modal"
          onClick={(e) => {
            if (e.target.className === 'floating-test-call-modal') {
              handleModalClose();
            }
          }}
        >
          <div className={`floating-test-call-modal-content ${callInitiated ? 'modal-success' : ''}`}>
            {/* Top Row: Voice Icon and Close Icon */}
            <div className="modal-top-row">
              <div className="modal-voice-icon-bordered">
                <div className="floating-test-call-sound-wave">
                  <div className="floating-test-call-sound-bar"></div>
                  <div className="floating-test-call-sound-bar"></div>
                  <div className="floating-test-call-sound-bar"></div>
                  <div className="floating-test-call-sound-bar"></div>
                  <div className="floating-test-call-sound-bar"></div>
                </div>
              </div>
              <button className="close-modal" onClick={() => {
                handleModalClose();
                setCallInitiated(false);
                setInitiatedCallData(null);
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {callInitiated ? (
              /* Success Screen */
              <div className="modal-success-content">
                <div className="success-hand-icon">
                  <img src="/images/Group 8744.svg" alt="Call Initiated" width="96" height="113" />
                </div>
                <h2 className="success-title">Your Call was Finished Successfully</h2>
                {initiatedCallData && (
                  <div className="success-agent-chip">
                    {initiatedCallData.agentMemoji && (
                      <div 
                        className="agent-chip-memoji"
                        style={{ backgroundColor: initiatedCallData.agentMemoji.background }}
                      >
                        <img src={initiatedCallData.agentMemoji.memoji} alt="" />
                      </div>
                    )}
                    <div className="agent-chip-info">
                      <span className="agent-chip-name">{initiatedCallData.agentName}</span>
                      <span className="agent-chip-phone">{initiatedCallData.phoneNumber}</span>
                    </div>
                  </div>
                )}
                <div className="success-actions">
                  <button className="btn-go-dashboard" onClick={handleGoToDashboard}>
                    Go to Dashboard
                  </button>
                  <button className="btn-call-another" onClick={handleCallAnother}>
                    Call another
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Content */}
                <div className="floating-test-call-modal-header-new">
              <div className="modal-header-left">
                <div className="modal-header-text">
                  <h3>Test your agent</h3>
                  <p>test call yourself or anyone to configure your agent</p>
                </div>
              </div>
              <div className="modal-header-right">
                <div className="agent-selector-wrapper">
                  <div 
                    className="agent-selector"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  >
                    {selectedAgent && selectedAgentMemoji ? (
                      <>
                        <div 
                          className="agent-memoji"
                          style={{ backgroundColor: selectedAgentMemoji.background }}
                        >
                          <img src={selectedAgentMemoji.memoji} alt="" />
                        </div>
                        <span className="agent-name">{selectedAgent.name}</span>
                      </>
                    ) : (
                      <span className="agent-placeholder">Select Agent</span>
                    )}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {showAgentDropdown && (
                    <div className="agent-dropdown-menu">
                      {agents.map((agent) => {
                        const agentMemoji = getAgentMemoji(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className="agent-dropdown-item"
                            onClick={() => {
                              setSelectedAgentId(agent.id.toString());
                              setShowAgentDropdown(false);
                            }}
                          >
                            <div 
                              className="agent-memoji"
                              style={{ backgroundColor: agentMemoji.background }}
                            >
                              <img src={agentMemoji.memoji} alt="" />
                            </div>
                            <span className="agent-name">{agent.name}</span>
                            <button
                              className="agent-edit-btn"
                              onClick={(e) => handleEditAgent(agent.id, e)}
                            >
                              <img src="/images/Edit.svg" alt="Edit" width="16" height="16" />
                            </button>
                          </div>
                        );
                      })}
                      {/* Template Options */}
                      <div
                        className="agent-dropdown-item"
                        onClick={() => {
                          setShowModal(false);
                          const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
                          const separator = shopParam ? '&' : '?';
                          navigate(`/playground${shopParam}${separator}template=test-scalysis-intro-laughter`);
                        }}
                        style={{ borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '8px' }}
                      >
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Test Scalysis Intro (Laughter)</span>
                      </div>
                      <div
                        className="agent-dropdown-item"
                        onClick={() => {
                          setShowModal(false);
                          const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
                          const separator = shopParam ? '&' : '?';
                          navigate(`/playground${shopParam}${separator}template=test-scalysis-no-laughter`);
                        }}
                      >
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Test Scalysis (No laughter)</span>
                      </div>
                      <div
                        className="agent-dropdown-item agent-create-new"
                        onClick={handleCreateNewAgent}
                        style={{ borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '8px' }}
                      >
                        <span className="agent-create-icon">+</span>
                        <span>create new</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dotted Divider */}
            <div className="modal-divider-dotted"></div>

            {/* Tabs */}
            <div className="modal-tabs">
              <button
                className={`tab-btn ${testCallTab === 'create' ? 'active' : ''}`}
                onClick={() => setTestCallTab('create')}
              >
                create test order
              </button>
              <button
                className={`tab-btn ${testCallTab === 'existing' ? 'active' : ''}`}
                onClick={() => {
                  setTestCallTab('existing');
                  loadTestOrders();
                }}
              >
                use existing
              </button>
            </div>

            {testCallTab === 'create' && (
              <div className="tab-content active">
                <form onSubmit={handleTestOrderSubmit} className="test-order-form">
                  <div className="form-row-grid">
                    <div className="form-group-vertical">
                      <label htmlFor="floatingTestCustomerName">
                        <img src="/images/Name.svg" alt="" width="16" height="16" />
                        <span>Name*:</span>
                      </label>
                      <input
                        type="text"
                        id="floatingTestCustomerName"
                        value={testOrderForm.customerName}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerName: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="form-group-vertical form-group-right">
                      <label htmlFor="floatingTestCustomerPhone">
                        <img src="/images/Phone.svg" alt="" width="16" height="16" />
                        <span>Phone*:</span>
                      </label>
                      <input
                        type="tel"
                        id="floatingTestCustomerPhone"
                        value={testOrderForm.customerPhone}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group-vertical">
                      <label htmlFor="floatingTestCustomerEmail">
                        <img src="/images/Email.svg" alt="" width="16" height="16" />
                        <span>Email:</span>
                      </label>
                      <input
                        type="email"
                        id="floatingTestCustomerEmail"
                        value={testOrderForm.customerEmail}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerEmail: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group-vertical form-group-right">
                      <label htmlFor="floatingTestOrderNumber">
                        <img src="/images/Order.svg" alt="" width="16" height="16" />
                        <span>Order Number:</span>
                      </label>
                      <input
                        type="text"
                        id="floatingTestOrderNumber"
                        value={testOrderForm.orderNumber}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, orderNumber: e.target.value }))
                        }
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div className="form-group-vertical form-group-address">
                    <label htmlFor="floatingTestCustomerAddress">
                      <img src="/images/Address.svg" alt="" width="16" height="16" />
                      <span>Address:</span>
                    </label>
                    <textarea
                      id="floatingTestCustomerAddress"
                      rows="3"
                      value={testOrderForm.customerAddress}
                      onChange={(e) =>
                        setTestOrderForm((prev) => ({ ...prev, customerAddress: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group-vertical">
                      <label htmlFor="floatingTestTotalPrice">
                        <img src="/images/Price.svg" alt="" width="16" height="16" />
                        <span>Total Price:</span>
                      </label>
                      <input
                        type="text"
                        id="floatingTestTotalPrice"
                        value={testOrderForm.totalPrice}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, totalPrice: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group-vertical form-group-right">
                      <label htmlFor="floatingTestCurrency">
                        <img src="/images/Currency.svg" alt="" width="16" height="16" />
                        <span>Currency:</span>
                      </label>
                      <input
                        type="text"
                        id="floatingTestCurrency"
                        value={testOrderForm.currency}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, currency: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={handleModalClose}
                    >
                      <img src="/images/Trash.svg" alt="" width="16" height="16" />
                      cancel
                    </button>
                    <button 
                      type="submit" 
                      className={`btn-create-queue ${!isFormValid || isCalling || cooldownSeconds > 0 ? 'btn-disabled' : ''}`}
                      disabled={!isFormValid || isCalling || cooldownSeconds > 0}
                    >
                      {isCalling ? (
                        <>
                          <div className="circular-loader-small"></div>
                          <span>Ongoing</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <>
                          <span>Cooldown: {cooldownSeconds}s</span>
                        </>
                      ) : (
                        <>
                          <span>+</span> create and call
                        </>
                      )}
                    </button>
                    {callError && (
                      <div style={{ marginTop: '12px', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                        {callError}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {testCallTab === 'existing' && (
              <div className="tab-content active">
                <div className="test-order-list">
                  {testOrders.length > 0 ? (
                    testOrders.map((order) => (
                      <div key={order.orderId || order.id} className="test-order-item">
                        <div className="test-order-info">
                          <h4>{escapeHtml(order.customerName || 'Unknown')}</h4>
                          <p>
                            {escapeHtml(order.customerPhone || 'No phone')} |{' '}
                            {escapeHtml(order.orderNumber || order.orderId)}
                          </p>
                          <p style={{ marginTop: '4px', fontSize: '11px', color: '#9ca3af' }}>
                            Status: {escapeHtml(order.callStatus || 'N/A')} | Created:{' '}
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <button
                          className="btn btn-success"
                          onClick={() => handleQueueTestOrder(order.id)}
                          disabled={isCalling || cooldownSeconds > 0}
                        >
                          {isCalling ? (
                            <>
                              <div className="circular-loader-small"></div>
                              <span>Ongoing</span>
                            </>
                          ) : cooldownSeconds > 0 ? (
                            <span>Cooldown: {cooldownSeconds}s</span>
                          ) : (
                            'Make Test Call'
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                      No test orders yet. Create one in the "Create Test Order" tab.
                    </p>
                  )}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingTestCallButton;

