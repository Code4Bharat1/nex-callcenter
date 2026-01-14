import React, { useState, useEffect } from 'react';
import {
  getCallScripts,
  createScript,
  updateScript,
  deleteScript,
  setDefaultScript,
  getVoices,
  previewVoice,
} from '../utils/api';
import './Scripts.css';

// Default scripts (hardcoded as in backend)
const DEFAULT_SCRIPTS = [
  {
    id: 1,
    name: 'Order Confirmation Call',
    content: 'Hello! This is [Your Name] calling from [Company Name]. I\'m calling to confirm your recent order #[ORDER_NUMBER] for [ORDER_AMOUNT]. I wanted to verify your delivery address and ensure everything is on track for delivery. Could you please confirm if the address [CUSTOMER_ADDRESS] is correct for delivery? Also, would you prefer any specific delivery time or have any special instructions? Thank you for choosing us!',
    isActive: false,
  },
  {
    id: 2,
    name: 'Address Verification Call',
    content: 'Hi there! This is [Your Name] from [Company Name]. I\'m calling regarding your order #[ORDER_NUMBER]. I noticed your delivery address might need some clarification. Could you please confirm the complete address including any landmarks or specific directions that would help our delivery team locate your place easily? This will ensure smooth and timely delivery of your order.',
    isActive: false,
  },
  {
    id: 3,
    name: 'Follow-up Call',
    content: 'Hello! This is [Your Name] calling from [Company Name]. I hope you\'re doing well! I\'m following up on your recent order #[ORDER_NUMBER] that was delivered on [DELIVERY_DATE]. I wanted to check if everything arrived as expected and if you\'re satisfied with your purchase. Is there anything we could have done better? Your feedback helps us improve our service.',
    isActive: false,
  },
  {
    id: 4,
    name: 'Payment Confirmation Call',
    content: 'Good day! This is [Your Name] from [Company Name]. I\'m calling regarding your order #[ORDER_NUMBER] for [ORDER_AMOUNT]. I wanted to confirm that your payment has been processed successfully. Your order is now being prepared for shipment. You\'ll receive a tracking number once it\'s shipped. Is there anything else you\'d like to know about your order?',
    isActive: false,
  },
];

// Utility function to escape HTML
const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

function Scripts({ shop }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    scriptContentVisible: '',
    scriptContentHidden: '',
    voiceId: '',
    initialGreeting: '',
    prePhrase: 'ji',
    useCustomAnalysis: false,
    customAnalysisPrompt: '',
    disableUnder35Retries: false,
    ttsProvider: null,
  });

  useEffect(() => {
    loadScripts();
  }, [shop]);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const response = await getCallScripts(shop);
      const scripts = response.scripts || [];
      console.log('[Scripts] Loaded scripts:', scripts.length);
      if (scripts.length > 0) {
        console.log('[Scripts] First script sample:', {
          id: scripts[0].id,
          name: scripts[0].name,
          hasContent: !!scripts[0].content,
          contentLength: scripts[0].content?.length || 0,
          hasFrontendDisplayScript: !!scripts[0].frontendDisplayScript,
          frontendDisplayScriptLength: scripts[0].frontendDisplayScript?.length || 0,
          fullScript: scripts[0]
        });
      }
      setScripts(scripts);
    } catch (error) {
      console.error('Error loading scripts:', error);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingScriptId(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      voiceId: '',
      initialGreeting: '',
      prePhrase: 'ji',
      useCustomAnalysis: false,
      customAnalysisPrompt: '',
      disableUnder35Retries: false,
    });
    setShowModal(true);
  };

  const handleEdit = (script) => {
    console.log('[Scripts] Editing script:', script);
    console.log('[Scripts] Script content:', script.content);
    console.log('[Scripts] Script scriptContentVisible:', script.scriptContentVisible);
    console.log('[Scripts] Script scriptContentHidden:', script.scriptContentHidden);
    
    setEditingScriptId(script.id);
    // Use scriptContentVisible if available, otherwise use content (for backward compatibility)
    // scriptContentHidden is kept in the script object but not shown to user
    const scriptContent = script.scriptContentVisible || script.content || '';
    const scriptHidden = script.scriptContentHidden || '';
    
    setFormData({
      name: script.name || '',
      description: script.description || '',
      content: scriptContent,
      scriptContentVisible: scriptContent,
      scriptContentHidden: scriptHidden,
      voiceId: script.voiceId || '',
      initialGreeting: script.initialGreeting || '',
      prePhrase: script.prePhrase || 'ji',
      useCustomAnalysis: script.useCustomAnalysis || false,
      customAnalysisPrompt: script.customAnalysisPrompt || '',
      disableUnder35Retries: script.disableUnder35Retries || false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingScriptId(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingScriptId) {
        response = await updateScript(editingScriptId, formData, shop);
      } else {
        response = await createScript(formData, shop);
      }

      if (response.success) {
        await loadScripts();
        handleCloseModal();
      } else {
        alert(response.error || 'Failed to save script');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Error saving script');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this script?')) return;

    try {
      const response = await deleteScript(id, shop);
      if (response.success) {
        await loadScripts();
      } else {
        alert(response.error || 'Failed to delete script');
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      alert('Error deleting script');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await setDefaultScript(id, shop);
      if (response.success) {
        await loadScripts();
      } else {
        alert(response.error || 'Failed to set default script');
      }
    } catch (error) {
      console.error('Error setting default script:', error);
      alert('Error setting default script');
    }
  };

  const handleAddDefaultScript = async (name, content) => {
    try {
      const response = await createScript(
        {
          name: name + ' (Copy)',
          content: content,
          description: 'Added from default scripts',
        },
        shop
      );

      if (response.success) {
        await loadScripts();
      } else {
        alert(response.error || 'Failed to add default script');
      }
    } catch (error) {
      console.error('Error adding default script:', error);
      alert('Error adding default script');
    }
  };

  const handleOpenVoiceModal = () => {
    setShowVoiceModal(true);
    fetchVoices();
  };

  const handleCloseVoiceModal = () => {
    setShowVoiceModal(false);
  };

  const fetchVoices = async (query = '') => {
    try {
      const response = await getVoices(query, shop);
      setVoices(response.voices || []);
    } catch (error) {
      console.error('Error fetching voices:', error);
      setVoices([]);
    }
  };

  const handleVoiceSearch = () => {
    fetchVoices(voiceSearchQuery);
  };

  const handleSelectVoice = (voiceId) => {
    setFormData((prev) => ({ ...prev, voiceId }));
    handleCloseVoiceModal();
  };

  const handlePreviewVoice = async (voiceId, btnElement) => {
    const originalText = btnElement.textContent;
    btnElement.textContent = 'Playing...';
    btnElement.disabled = true;

    try {
      const audioBlob = await previewVoice(voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        btnElement.textContent = originalText;
        btnElement.disabled = false;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        btnElement.textContent = originalText;
        btnElement.disabled = false;
        alert('Failed to play preview');
      };

      await audio.play();
    } catch (error) {
      console.error('Preview error:', error);
      btnElement.textContent = originalText;
      btnElement.disabled = false;
      alert('Failed to generate preview: ' + error.message);
    }
  };

  const handleCopyVoiceId = async (voiceId, btnElement) => {
    try {
      await navigator.clipboard.writeText(voiceId);
      const originalText = btnElement.textContent;
      btnElement.textContent = 'Copied!';
      btnElement.style.background = '#10b981';

      setTimeout(() => {
        btnElement.textContent = originalText;
        btnElement.style.background = '#0073e6';
      }, 2000);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = voiceId;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        const originalText = btnElement.textContent;
        btnElement.textContent = 'Copied!';
        btnElement.style.background = '#10b981';
        setTimeout(() => {
          btnElement.textContent = originalText;
          btnElement.style.background = '#0073e6';
        }, 2000);
      } catch (err) {
        alert('Failed to copy. Voice ID: ' + voiceId);
      }
      document.body.removeChild(textarea);
    }
  };

  if (loading) {
    return (
      <div className="scripts-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="scripts-container">
      {/* Welcome Section */}
      <section className="script-section">
        <div
          className="welcome-message"
          style={{
            background: '#e8f5e8',
            border: '1px solid #50b83c',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#50b83c' }}>🎯 Welcome to Call Agents!</h3>
          <p style={{ margin: '0', color: '#202223' }}>
            Create and manage your call agents here. When you click "Set Queue" on an order, you'll be prompted to
            select an agent for that call.
          </p>
        </div>
      </section>

      {/* Scripts Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* User Scripts Section (Left) */}
        <section className="script-section">
          <div className="section-header">
            {/* Title removed - already shown in TopBar */}
            <button className="btn btn-primary" onClick={handleCreateNew}>
              Create New Script
            </button>
          </div>

          <div id="user-scripts">
            {scripts && scripts.length > 0 ? (
              scripts.map((script) => {
                const hasCustomFeatures =
                  script.voiceId ||
                  script.initialGreeting ||
                  script.prePhrase ||
                  script.useCustomAnalysis ||
                  script.customAnalysisPrompt ||
                  script.disableUnder35Retries;

                return (
                  <div key={script.id} className="script-card">
                    <div className="script-header">
                      <div>
                        <div className="script-name">
                          {escapeHtml(script.name)}
                          {script.isActive && <span style={{ color: '#50b83c', fontSize: '12px' }}> (Default)</span>}
                        </div>
                        {script.description && (
                          <div style={{ color: '#6d7175', fontSize: '14px' }}>{escapeHtml(script.description)}</div>
                        )}

                        {/* Custom Features Indicators */}
                        {hasCustomFeatures && (
                          <div style={{ marginTop: '8px' }}>
                            <span
                              style={{
                                background: '#5c6ac4',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                marginRight: '4px',
                              }}
                            >
                              🎛️ Custom
                            </span>
                            {script.voiceId && (
                              <span
                                style={{
                                  background: '#e1e5e9',
                                  color: '#202223',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  marginRight: '4px',
                                }}
                              >
                                Voice
                              </span>
                            )}
                            {script.initialGreeting && (
                              <span
                                style={{
                                  background: '#e1e5e9',
                                  color: '#202223',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  marginRight: '4px',
                                }}
                              >
                                Hindi
                              </span>
                            )}
                            {script.useCustomAnalysis && (
                              <span
                                style={{
                                  background: '#e1e5e9',
                                  color: '#202223',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  marginRight: '4px',
                                }}
                              >
                                AI
                              </span>
                            )}
                            {script.disableUnder35Retries && (
                              <span
                                style={{
                                  background: '#e1e5e9',
                                  color: '#202223',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  marginRight: '4px',
                                }}
                              >
                                No Retry
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="script-actions">
                        <button className="btn btn-secondary" onClick={() => handleEdit(script)}>
                          Edit
                        </button>
                        {!script.isActive && (
                          <button className="btn btn-success" onClick={() => handleSetDefault(script.id)}>
                            Set Default
                          </button>
                        )}
                        <button className="btn btn-danger" onClick={() => handleDelete(script.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="script-content">
                      {escapeHtml(((script.scriptContentVisible || script.content) || '').substring(0, 200))}
                      {((script.scriptContentVisible || script.content) || '').length > 200 ? '...' : ''}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="script-card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#202223' }}>No scripts created yet</h3>
                <p style={{ margin: '0 0 24px 0', color: '#6d7175' }}>
                  Create your first script or add one from the default templates on the right.
                </p>
                <button className="btn btn-primary" onClick={handleCreateNew}>
                  Create Your First Script
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Default Scripts Section (Right) */}
        <section className="script-section">
          <div className="section-header">
            {/* Title removed - already shown in TopBar */}
            <p style={{ margin: '0', color: '#6d7175', fontSize: '14px' }}>
              Pre-built templates you can add to your account
            </p>
          </div>

          <div id="default-scripts">
            {DEFAULT_SCRIPTS.map((script) => (
              <div key={script.id} className="script-card default-script">
                <div className="script-header">
                  <div>
                    <div className="script-name">{escapeHtml(script.name)}</div>
                    <div style={{ color: '#6d7175', fontSize: '14px' }}>Pre-built template</div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => handleAddDefaultScript(script.name, script.content)}
                  >
                    Add Script
                  </button>
                </div>
                <div className="script-content">
                  {escapeHtml(script.content.substring(0, 200))}
                  {script.content.length > 200 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create/Edit Script Modal */}
      {showModal && (
        <div
          className="modal"
          style={{ display: 'block' }}
          onClick={(e) => {
            if (e.target.classList.contains('modal')) {
              handleCloseModal();
            }
          }}
        >
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 id="modalTitle">{editingScriptId ? 'Edit Script' : 'Create New Script'}</h3>
            <form id="scriptForm" onSubmit={handleSubmit}>
              {/* Basic Script Information */}
              <div className="form-group">
                <label htmlFor="scriptName">Script Name</label>
                <input
                  type="text"
                  id="scriptName"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="scriptDescription">Description (Optional)</label>
                <input
                  type="text"
                  id="scriptDescription"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="scriptContent">Script Content</label>
                <textarea
                  id="scriptContent"
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter your call script here..."
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6d7175' }}>
                  <strong>Template Variables:</strong> [ORDER_NUMBER], [ORDER_AMOUNT], [CUSTOMER_NAME], [CUSTOMER_ADDRESS], [DELIVERY_DATE]
                </div>
              </div>

              {/* Custom Script Features */}
              <div style={{ borderTop: '2px solid #e1e5e9', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ color: '#202223', marginBottom: '15px' }}>🎛️ Custom Script Features</h4>

                {/* Voice Configuration */}
                <div className="form-group">
                  <label htmlFor="voiceId">Voice</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      id="voiceId"
                      name="voiceId"
                      value={formData.voiceId}
                      onChange={handleFormChange}
                      placeholder="voice id"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      id="openVoiceSearch"
                      style={{ padding: '8px 12px' }}
                      onClick={handleOpenVoiceModal}
                    >
                      Search voices
                    </button>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                    Select from Cartesia catalogue or paste a voice id
                  </div>
                </div>

                {/* Initial Greeting */}
                <div className="form-group">
                  <label htmlFor="initialGreeting">Initial Greeting</label>
                  <textarea
                    id="initialGreeting"
                    name="initialGreeting"
                    value={formData.initialGreeting}
                    onChange={handleFormChange}
                    placeholder="Hello {{customer_name}} ji se baat ho rahi hai?"
                  />
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                    First greeting when call connects. Use {{customer_name}} for customer name placeholder
                  </div>
                </div>

                {/* Pre-phrase */}
                <div className="form-group">
                  <label htmlFor="prePhrase">Pre-phrase Text</label>
                  <input
                    type="text"
                    id="prePhrase"
                    name="prePhrase"
                    value={formData.prePhrase}
                    onChange={handleFormChange}
                    placeholder="ji"
                  />
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                    Short acknowledgment spoken after customer speaks (e.g., 'ji', 'okay', 'yes')
                  </div>
                </div>

                {/* Custom Analysis Section */}
                <div
                  style={{
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    padding: '15px',
                    marginTop: '15px',
                    background: '#f8f9fa',
                  }}
                >
                  <h5 style={{ color: '#202223', marginBottom: '10px' }}>🤖 Custom Analysis Settings</h5>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="useCustomAnalysis"
                        name="useCustomAnalysis"
                        checked={formData.useCustomAnalysis}
                        onChange={handleFormChange}
                      />
                      <span>Use Custom Analysis Method</span>
                    </label>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                      Enable custom GPT analysis for this script
                    </div>
                  </div>

                  {formData.useCustomAnalysis && (
                    <div className="form-group" id="customAnalysisPromptGroup">
                      <label htmlFor="customAnalysisPrompt">Custom Analysis Prompt</label>
                      <textarea
                        id="customAnalysisPrompt"
                        name="customAnalysisPrompt"
                        value={formData.customAnalysisPrompt}
                        onChange={handleFormChange}
                        placeholder="Analyze this call transcript to determine if customer wants to confirm their order (return 'change address'), cancel their order (return 'cancelled'), or needs manual help (return 'Handle Manually'). Provide interest score 0-10 and brief summary. Respond in JSON format with fields: call_outcome_category, call_interest_score, call_summary, address_change_requested, new_address, forensic_breakdown."
                      />
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                        Custom GPT prompt for call analysis. For order confirmation calls, use 'change address' for order confirmed, 'cancelled' for order cancelled. Must return JSON with required fields.
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="disableUnder35Retries"
                        name="disableUnder35Retries"
                        checked={formData.disableUnder35Retries}
                        onChange={handleFormChange}
                      />
                      <span>Disable Early Disconnect Retry Logic</span>
                    </label>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#6d7175' }}>
                      Disable automatic retries for early disconnect calls
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Save Script
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div
          id="voiceSearchModal"
          style={{
            display: 'block',
            position: 'fixed',
            inset: '0',
            background: 'rgba(0,0,0,0.4)',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target.id === 'voiceSearchModal') {
              handleCloseVoiceModal();
            }
          }}
        >
          <div
            style={{
              maxWidth: '720px',
              margin: '60px auto',
              background: '#fff',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0 }}>Select a voice</h3>
              <button
                id="closeVoiceSearch"
                onClick={handleCloseVoiceModal}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                id="voiceSearchInput"
                placeholder="Search by name/language"
                value={voiceSearchQuery}
                onChange={(e) => setVoiceSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleVoiceSearch();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              />
              <button
                id="voiceSearchBtn"
                onClick={handleVoiceSearch}
                style={{ padding: '8px 12px' }}
              >
                🔍
              </button>
            </div>
            <div
              id="voiceList"
              style={{
                maxHeight: '380px',
                overflow: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
              }}
            >
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600' }}>{voice.name || 'Untitled'}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{voice.language || ''}</div>
                    <div
                      style={{ fontSize: '12px', color: '#6b7280', maxWidth: '520px' }}
                      dangerouslySetInnerHTML={{ __html: (voice.description || '').replace(/</g, '&lt;') }}
                    />
                  </div>
                  <div>
                    <button
                      data-id={voice.id}
                      className="previewVoiceBtn"
                      onClick={(e) => handlePreviewVoice(voice.id, e.target)}
                      style={{
                        padding: '6px 10px',
                        marginRight: '4px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Preview
                    </button>
                    <button
                      data-id={voice.id}
                      className="copyVoiceBtn"
                      onClick={(e) => handleCopyVoiceId(voice.id, e.target)}
                      style={{
                        padding: '6px 10px',
                        background: '#0073e6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy ID
                    </button>
                    <button
                      onClick={() => handleSelectVoice(voice.id)}
                      style={{
                        padding: '6px 10px',
                        marginLeft: '4px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                id="createVoiceBtn"
                onClick={() => {
                  handleCloseVoiceModal();
                  window.location.href = '/voices' + (shop ? `?shop=${encodeURIComponent(shop)}` : '');
                }}
                style={{ padding: '8px 12px' }}
              >
                Create voice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scripts;


