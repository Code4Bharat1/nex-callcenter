import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { getCallScripts, getTestOrders, createTestOrder } from '../utils/api';
import { Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import EngineStatus from '../components/EngineStatus';
import { useAudioLevel } from '../hooks/useAudioLevel';
import './TestCall.css';

// Memoji files array (same as FloatingTestCallButton)
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

const MEMOJI_BACKGROUNDS = [
  '#F9FFF1', '#FFF9F0', '#F0F9FF', '#F9F0FF', '#FFF0F9',
  '#F0FFF9', '#FFF5F0', '#F5F0FF', '#F0F5FF', '#FFF0F5',
];

const getAgentMemoji = (agentId) => {
  const index = agentId ? (parseInt(agentId) % MEMOJI_FILES.length) : 0;
  const bgIndex = agentId ? (parseInt(agentId) % MEMOJI_BACKGROUNDS.length) : 0;
  return {
    memoji: MEMOJI_FILES[index],
    background: MEMOJI_BACKGROUNDS[bgIndex],
  };
};

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const TestCall = ({ shop }) => {
  const [room, setRoom] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Ready to connect');
  const [roomName, setRoomName] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [audioStream, setAudioStream] = useState(null);
  const audioStreamRef = useRef(null);
  const { levelRef: audioLevelRef, ready: audioReady, start: startAudio, stop: stopAudio } = useAudioLevel();
  const [audioLevel, setAudioLevel] = useState(0);

  // Agent/script selection
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  
  // Test order selection
  const [testOrders, setTestOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [testOrderTab, setTestOrderTab] = useState('create'); // 'existing' or 'create'
  const [testOrderForm, setTestOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    totalPrice: '',
    currency: 'INR',
    orderNumber: '',
  });

  // Audio device selection
  const [audioDevices, setAudioDevices] = useState({ microphones: [], speakers: [] });
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);

  const selectedAgent = useMemo(() => {
    return agents.find(agent => agent.id.toString() === selectedAgentId);
  }, [agents, selectedAgentId]);

  const selectedAgentMemoji = useMemo(() => {
    return selectedAgent ? getAgentMemoji(selectedAgent.id) : null;
  }, [selectedAgent]);

  // Check if both agent and order are selected
  const canStartCall = useMemo(() => {
    return selectedAgentId !== '' && selectedOrderId !== '';
  }, [selectedAgentId, selectedOrderId]);

  // Check if agent is selected
  const isAgentSelected = useMemo(() => {
    return selectedAgentId !== '';
  }, [selectedAgentId]);

  // Check if order is selected or form is valid
  const isOrderSelected = useMemo(() => {
    if (testOrderTab === 'existing') {
      return selectedOrderId !== '';
    } else {
      // For create tab, check if required fields are filled
      return testOrderForm.customerName.trim() !== '' && 
             testOrderForm.customerPhone.trim() !== '';
    }
  }, [testOrderTab, selectedOrderId, testOrderForm.customerName, testOrderForm.customerPhone]);

  // Check if both participants are connected (user + agent)
  const bothParticipantsConnected = useMemo(() => {
    return isConnected && participants.length > 0;
  }, [isConnected, participants.length]);

  // Smooth audio level updates for button animation
  useEffect(() => {
    if (!audioReady || !isConnected) {
      setAudioLevel(0);
      return;
    }

    const update = () => {
      setAudioLevel(prev => prev + (audioLevelRef.current - prev) * 0.2);
      requestAnimationFrame(update);
    };

    update();
  }, [audioReady, isConnected, audioLevelRef]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  // Load agents and test orders on mount
  useEffect(() => {
    if (shop) {
      loadAgents();
      loadTestOrders();
    }
  }, [shop]);

  // Load audio devices
  useEffect(() => {
    const loadAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');
        
        setAudioDevices({ microphones, speakers });
        
        // Set default devices
        if (microphones.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(microphones[0].deviceId);
        }
        if (speakers.length > 0 && !selectedSpeaker) {
          setSelectedSpeaker(speakers[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading audio devices:', error);
      }
    };

    loadAudioDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices);
    };
  }, []);

  // Handle agent pre-selection from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const agentParam = urlParams.get('agent');
    if (agentParam && agents.length > 0) {
      setSelectedAgentId(agentParam);
    }
  }, [agents]);

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

  const loadAgents = async () => {
    try {
      const response = await getCallScripts(shop);
      const scripts = response?.scripts || response || [];
      const validAgents = Array.isArray(scripts) ? scripts.filter(agent => agent && agent.id) : [];
      setAgents(validAgents);
      if (validAgents.length > 0 && !selectedAgentId) {
        setSelectedAgentId(validAgents[0].id.toString());
      }
    } catch (error) {
      console.error('[TestCall] Error loading agents:', error);
      setAgents([]);
    }
  };

  const loadTestOrders = async () => {
    try {
      const response = await getTestOrders(shop);
      const orders = response?.orders || response || [];
      setTestOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error('[TestCall] Error loading test orders:', error);
      setTestOrders([]);
    }
  };

  const handleCreateTestOrder = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      alert('Please select an agent first');
      return;
    }

    try {
      const response = await createTestOrder(testOrderForm, shop);
      if (response.success && response.order) {
        // Set the newly created order as selected
        const orderId = response.order.id || response.order.orderId;
        if (orderId) {
          setSelectedOrderId(orderId.toString());
        }
        // Reload test orders
        await loadTestOrders();
        // Switch to existing tab
        setTestOrderTab('existing');
        alert('Test order created successfully!');
        // Advance tutorial to next step
        if (window.tutorialNextStep) {
          window.tutorialNextStep();
        }
      } else {
        alert(response.error || 'Failed to create test order');
      }
    } catch (error) {
      console.error('[TestCall] Error creating test order:', error);
      alert('Error creating test order');
    }
  };

  const startCall = async () => {
    if (!canStartCall) {
      alert('Please select both an agent and a test order before starting the call');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setStatus('Calling API...');

      // Step 1: Call backend API to get token
      const response = await fetch('/api/startCall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: `user-${Date.now()}`,
          user_name: selectedAgent?.name || 'Test User',
          order_id: parseInt(selectedOrderId),
          script_id: parseInt(selectedAgentId),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start call';
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData?.detail || errorData?.error || errorMessage;
          } catch (jsonError) {
            console.warn('[TestCall] Non-JSON error body despite JSON content-type:', jsonError);
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText.slice(0, 200);
          }
        }

        throw new Error(errorMessage);
      }

      const { token, room: roomName, ws_url } = await response.json();
      setRoomName(roomName);
      setStatus(`Room created: ${roomName}. Connecting...`);

      // Step 2: Create LiveKit room instance
      const newRoom = new Room();

      // Step 3: Set up event listeners
      setupRoomEvents(newRoom);

      // Step 4: Connect to LiveKit room
      setStatus('Connecting to LiveKit...');
      await newRoom.connect(ws_url, token);

      // Step 5: Enable microphone
      setStatus('Enabling microphone...');
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      // Get user's microphone stream for audio level detection
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        audioStreamRef.current = stream;
        startAudio(stream);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }

      setRoom(newRoom);
      setIsConnected(true);
      setIsConnecting(false);
      setStatus('Connected! Waiting for agent...');

    } catch (err) {
      console.error('Error starting call:', err);
      setError(err.message);
      setStatus(`Error: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const setupRoomEvents = (room) => {
    // Connection events
    room.on(RoomEvent.Connected, () => {
      console.log('Connected to room');
      setStatus('Connected to room');
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log('Disconnected from room:', reason);
      setStatus(`Disconnected: ${reason}`);
      setIsConnected(false);
      setRoom(null);
    });

    // Participant events
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
      setParticipants(prev => [...prev, participant.identity]);
      setStatus(`Agent connected: ${participant.identity}`);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
      setParticipants(prev => prev.filter(p => p !== participant.identity));
      setStatus(`Participant left: ${participant.identity}`);
    });

    // Track events
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, participant.identity);
      if (track.kind === 'audio') {
        const audioElement = track.attach();
        document.body.appendChild(audioElement);
        audioElement.play();
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind);
      track.detach();
    });
  };

  const endCall = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
      setStatus('Call ended');
      
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        setAudioStream(null);
      }
      stopAudio();
    }
  };

  const getStatusColor = () => {
    if (isConnected) return '#10b981';
    if (isConnecting) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle2 size={16} />;
    if (isConnecting) return <Loader2 size={16} className="spinning" />;
    return <AlertCircle size={16} />;
  };

  return (
    <div className="test-call-page">
      <div className="test-call-container">
        {/* Header - Compact, Strong Hierarchy */}
        <div className="test-call-header tour-part1-step2-header">
          <div className="test-call-header-content">
            <h1 className="test-call-title">Test Script</h1>
            <p className="test-call-subtitle">Run and test AI calls.</p>
          </div>
          <div className="test-call-header-right">
            {/* Engine Status - Top Right */}
            {isConnected && (
              <EngineStatus 
                isActive={isConnected} 
                status={bothParticipantsConnected ? 'active' : 'warmup'} 
              />
            )}
            {/* Status Badge - Integrated in Header */}
            <div className="test-call-status-badge" style={{ color: getStatusColor() }}>
              {getStatusIcon()}
              <span>{status}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="test-call-main">
          {/* Left Column - Configuration */}
          <div className="test-call-config">
            {/* Agent Selection Section */}
            <div className="test-call-section">
              <div className="test-call-section-header">
                <h2 className="test-call-section-title">Select Script</h2>
                {isAgentSelected ? (
                  <span className="test-call-selected">
                    <CheckCircle2 size={14} />
                    Selected
                  </span>
                ) : (
                  <span className="test-call-required">Required</span>
                )}
              </div>
              <div className="agent-selector-wrapper">
                <div
                  className="agent-selector tour-part1-step2-agent"
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
                      <div className="agent-info">
                        <span className="agent-name">{selectedAgent.name}</span>
                        {selectedAgent.description && (
                          <span className="agent-desc">{selectedAgent.description}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="agent-placeholder">Select an agent</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                          <div className="agent-info">
                            <span className="agent-name">{agent.name}</span>
                            {agent.description && (
                              <span className="agent-desc">{agent.description}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Test Order Section */}
            <div className="test-call-section">
              <div className="test-call-section-header">
                <h2 className="test-call-section-title">Use customer information</h2>
                {isOrderSelected ? (
                  <span className="test-call-selected">
                    <CheckCircle2 size={14} />
                    Selected
                  </span>
                ) : (
                  <span className="test-call-required">Required</span>
                )}
              </div>
              
              {/* Tabs - Modern Design */}
              <div className="test-order-tabs">
                <button
                  className={`test-order-tab ${testOrderTab === 'existing' ? 'active' : ''}`}
                  onClick={() => {
                    setTestOrderTab('existing');
                    loadTestOrders();
                  }}
                >
                  Use customer information
                </button>
                <button
                  className={`test-order-tab tutorial-new-order-tab ${testOrderTab === 'create' ? 'active' : ''}`}
                  onClick={() => setTestOrderTab('create')}
                >
                  New Order
                </button>
              </div>

              {/* Existing Orders List */}
              {testOrderTab === 'existing' && (
                <div className="test-order-list tour-part1-step2-order">
                  {testOrders.length > 0 ? (
                    testOrders.map((order) => (
                      <div 
                        key={order.orderId || order.id} 
                        className={`test-order-item tutorial-test-order-item ${selectedOrderId === (order.id || order.orderId)?.toString() ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedOrderId((order.id || order.orderId)?.toString());
                          // Advance tutorial when order is selected
                          if (window.tutorialNextStep) {
                            window.tutorialNextStep();
                          }
                        }}
                      >
                        <div className="test-order-item-content">
                          <div className="test-order-item-main">
                            <h4 className="test-order-customer-name">{escapeHtml(order.customerName || 'Unknown')}</h4>
                            <div className="test-order-meta">
                              <span>{escapeHtml(order.customerPhone || 'No phone')}</span>
                              <span className="test-order-separator">•</span>
                              <span>{escapeHtml(order.orderNumber || order.orderId)}</span>
                            </div>
                          </div>
                          {selectedOrderId === (order.id || order.orderId)?.toString() && (
                            <CheckCircle2 size={20} className="test-order-check" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="test-order-empty">
                      <p>No test orders available</p>
                      <p className="test-order-empty-hint">Create one in the "Create New" tab</p>
                    </div>
                  )}
                </div>
              )}

              {/* Create Order Form */}
              {testOrderTab === 'create' && (
                <form onSubmit={handleCreateTestOrder} className="test-order-form tutorial-create-order-form">
                  <div className="test-order-form-grid">
                    <div className="test-order-form-group">
                      <label htmlFor="testCustomerName">
                        Customer Name <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        id="testCustomerName"
                        className="tutorial-customer-name-input"
                        value={testOrderForm.customerName}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerName: e.target.value }))
                        }
                        required
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="test-order-form-group">
                      <label htmlFor="testCustomerPhone">
                        Phone Number <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="tel"
                        id="testCustomerPhone"
                        className="tutorial-customer-phone-input"
                        value={testOrderForm.customerPhone}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))
                        }
                        required
                        placeholder="+91 1234567890"
                      />
                    </div>
                    <div className="test-order-form-group">
                      <label htmlFor="testCustomerEmail">Email</label>
                      <input
                        type="email"
                        id="testCustomerEmail"
                        value={testOrderForm.customerEmail}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerEmail: e.target.value }))
                        }
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div className="test-order-form-group">
                      <label htmlFor="testOrderNumber">Order Number</label>
                      <input
                        type="text"
                        id="testOrderNumber"
                        value={testOrderForm.orderNumber}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, orderNumber: e.target.value }))
                        }
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="test-order-form-group test-order-form-group-full">
                      <label htmlFor="testCustomerAddress">Address</label>
                      <textarea
                        id="testCustomerAddress"
                        rows="3"
                        value={testOrderForm.customerAddress}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, customerAddress: e.target.value }))
                        }
                        placeholder="Enter delivery address"
                      />
                    </div>
                    <div className="test-order-form-group">
                      <label htmlFor="testTotalPrice">Total Price</label>
                      <input
                        type="text"
                        id="testTotalPrice"
                        value={testOrderForm.totalPrice}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, totalPrice: e.target.value }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="test-order-form-group">
                      <label htmlFor="testCurrency">Currency</label>
                      <input
                        type="text"
                        id="testCurrency"
                        value={testOrderForm.currency}
                        onChange={(e) =>
                          setTestOrderForm((prev) => ({ ...prev, currency: e.target.value }))
                        }
                        placeholder="INR"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="test-order-create-btn tutorial-create-order-btn"
                  >
                    Create Test Order
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="test-call-actions">
            {/* Primary Action Buttons */}
            <div className="test-call-action-section">
              {!isConnected && !isConnecting && (
                <>
                  <button
                    onClick={startCall}
                    className={`test-call-primary-btn test-on-web-btn tour-part1-step2-test tutorial-start-call ${!canStartCall ? 'disabled' : ''}`}
                    disabled={!canStartCall}
                  >
                    <Phone size={18} strokeWidth={2.5} />
                    <span>{canStartCall ? 'Test On Web' : 'Select Agent & Order'}</span>
                  </button>
                  <button 
                    className={`test-call-primary-btn test-on-call-btn ${!canStartCall ? 'disabled' : ''}`}
                    disabled={!canStartCall}
                    onClick={() => {
                      if (canStartCall) {
                        // Open the FloatingTestCallButton modal (same as widget)
                        const floatingButton = document.querySelector('.floating-test-call-btn');
                        if (floatingButton) {
                          floatingButton.click();
                        }
                      }
                    }}
                  >
                    <Phone size={18} strokeWidth={2.5} />
                    <span>Test On Call</span>
                  </button>
                </>
              )}

              {isConnecting && (
                <button disabled className="test-call-primary-btn connecting">
                  <Loader2 size={18} className="spinning" strokeWidth={2.5} />
                  <span>Connecting...</span>
                </button>
              )}

              {isConnected && (
                <button 
                  onClick={endCall} 
                  className={`test-call-primary-btn connected ${bothParticipantsConnected ? 'active' : ''}`}
                  style={{
                    '--audio-level': audioLevel,
                    '--glow-intensity': Math.min(1, 0.3 + audioLevel * 0.7)
                  }}
                >
                  <Phone size={18} strokeWidth={2.5} />
                  <span>End Call</span>
                </button>
              )}
            </div>

            {/* Audio Device Selection Panel */}
            <div className="test-call-device-panel">
              <div className="test-call-device-group">
                <label className="test-call-device-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Microphone
                </label>
                <select
                  className="test-call-device-select"
                  value={selectedMicrophone || ''}
                  onChange={(e) => setSelectedMicrophone(e.target.value)}
                >
                  {audioDevices.microphones.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${audioDevices.microphones.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="test-call-device-group">
                <label className="test-call-device-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  Output Device
                </label>
                <select
                  className="test-call-device-select"
                  value={selectedSpeaker || ''}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                >
                  {audioDevices.speakers.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${audioDevices.speakers.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Connection Info */}
            {roomName && (
              <div className="test-call-info-section">
                <h3 className="test-call-info-title">Connection Details</h3>
                <div className="test-call-info-grid">
                  <div className="test-call-info-item">
                    <span className="test-call-info-label">Room</span>
                    <span className="test-call-info-value">{roomName}</span>
                  </div>
                  <div className="test-call-info-item">
                    <span className="test-call-info-label">Participants</span>
                    <span className="test-call-info-value">{participants.length + (isConnected ? 1 : 0)}</span>
                  </div>
                </div>
                {participants.length > 0 && (
                  <div className="test-call-participants">
                    {participants.map((p, i) => (
                      <div key={i} className="test-call-participant">
                        <CheckCircle2 size={14} />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="test-call-error-section">
                <AlertCircle size={18} />
                <div>
                  <h4>Connection Error</h4>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Quick Guide */}
            <div className="test-call-guide">
              <h3 className="test-call-guide-title">Quick Start</h3>
              <ul className="test-call-guide-steps">
                <li>Pick an AI</li>
                <li>Select order</li>
                <li>Start call</li>
                <li>Allow mic</li>
                <li>AI joins automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TestCall;
