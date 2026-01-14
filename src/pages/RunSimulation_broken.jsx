import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './Playground.css';

const RunSimulation = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  // State for current script
  const [formData, setFormData] = useState({ content: '' });
  const [agents, setAgents] = useState([]);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  
  // Evaluation state
  const [extractorPrompt, setExtractorPrompt] = useState(`You are an expert at analyzing AI voice agent scripts and extracting evaluation criteria.

Given a script for an AI voice agent, extract the key rules and guidelines that define what makes a good conversation. Focus on:

1. **Purpose & Goals**: What is the agent trying to achieve? (e.g., recover abandoned checkout, provide support)
2. **Tone & Style**: How should the agent communicate? (e.g., friendly, professional, empathetic)
3. **Required Information**: What information must be collected or provided?
4. **Success Criteria**: What indicates a successful conversation?
5. **Constraints**: What should the agent avoid or never do?

Return a structured list of evaluation criteria that can be used to assess if a conversation follows the script properly.`);

  const [evaluatorPrompt, setEvaluatorPrompt] = useState(`You are an expert evaluator of AI voice agent conversations.

You will be given:
1. An original script/guideline for the agent
2. A conversation transcript between the agent and a customer
3. Evaluation criteria extracted from the script

Your task is to:
1. Analyze how well the conversation followed the script and criteria
2. Identify what was done well
3. Identify areas for improvement
4. Assign a score from 0-10 (where 10 is perfect adherence to the script)

Provide your evaluation in this format:
**Score**: [0-10]
**What Went Well**: [List of positives]
**Areas for Improvement**: [List of issues]
**Reasoning**: [Detailed explanation]`);

  const [testCasePrompt, setTestCasePrompt] = useState(`You are simulating a customer in a phone call conversation. You will respond to the agent's messages based on your personality and the scenario.

**Scenario**: {scenario}

**Your Personality**: {personality}

**Instructions**:
- Respond naturally as a customer would
- Stay in character with your assigned personality
- React appropriately to the agent's messages
- Keep responses concise (1-3 sentences typically)
- End the conversation naturally when appropriate`);

  const [scenario, setScenario] = useState('you ordered a product from this website yesterday');
  const [personalityPrompts, setPersonalityPrompts] = useState({
    cooperative: 'You are helpful and willing to engage. You answer questions directly and follow instructions.',
    difficult: 'You are skeptical and challenging. You question things and need convincing.',
    confused: 'You are uncertain and need things explained multiple times. You ask for clarification often.'
  });

  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false);
  const [evaluationVariables, setEvaluationVariables] = useState({
    customer_name: 'John',
    order_number: '12345',
    product_name: 'Wireless Headphones',
    delivery_date: 'Tomorrow',
    phone_number: '+91 98765 43210'
  });

  const [testCases, setTestCases] = useState([]);
  const evaluationDefaultsLoaded = useRef(false);
  
  // Tab state for the 3-tab structure
  const [activeSimTab, setActiveSimTab] = useState('setup'); // 'setup', 'run', 'advanced'
  
  // Pre-made scenarios
  const preMadeScenarios = [
    { id: 'delivery', label: 'Product delivery problem', scenario: 'Your order was supposed to be delivered yesterday but you haven\'t received it yet' },
    { id: 'refund', label: 'Refund request', scenario: 'You want to return a product and get a refund' },
    { id: 'tracking', label: 'Order tracking issue', scenario: 'You cannot track your order and want to know where it is' },
    { id: 'billing', label: 'Billing complaint', scenario: 'You were charged twice for the same order' },
    { id: 'custom', label: 'Create Custom', scenario: '' }
  ];
  const [selectedPreMade, setSelectedPreMade] = useState('');

  // Load test cases and default prompts
  useEffect(() => {
    const loadEvaluationTestCases = async () => {
      if (!evaluationDefaultsLoaded.current) {
        try {
          console.log('[RunSimulation] Loading evaluation test cases...');
          const result = await api.getEvaluationTestCases(shop);
          if (result.success && result.testCases) {
            setTestCases(result.testCases);
            console.log('[RunSimulation] Loaded test cases:', result.testCases.length);
          }

          // Load default prompts
          const promptsResult = await api.getEvaluationDefaultPrompts();
          if (promptsResult.success) {
            if (promptsResult.extractorPrompt) setExtractorPrompt(promptsResult.extractorPrompt);
            if (promptsResult.evaluatorPrompt) setEvaluatorPrompt(promptsResult.evaluatorPrompt);
            if (promptsResult.testCasePrompt) setTestCasePrompt(promptsResult.testCasePrompt);
            if (promptsResult.personalityPrompts) setPersonalityPrompts(promptsResult.personalityPrompts);
            console.log('[RunSimulation] Loaded default prompts');
          }

          evaluationDefaultsLoaded.current = true;
        } catch (error) {
          console.error('[RunSimulation] Error loading evaluation data:', error);
        }
      }
    };

    loadEvaluationTestCases();
  }, [shop]);

  // Load agents
  useEffect(() => {
    const loadData = async () => {
      try {
        const [agentsResult] = await Promise.all([
          api.getScripts(shop),
        ]);

        if (agentsResult.success && agentsResult.data) {
          setAgents(agentsResult.data);
          
          // Select first agent if available
          if (agentsResult.data.length > 0 && !currentAgentId) {
            const firstAgent = agentsResult.data[0];
            setCurrentAgentId(firstAgent.id);
            setFormData({ content: firstAgent.content || '' });
          }
        }
      } catch (error) {
        console.error('[RunSimulation] Error loading data:', error);
      }
    };

    loadData();
  }, [shop]);

  return (
    <div className="playground-container">
      <div className="playground-content">
        <div className="form-section" style={{ padding: '24px', marginBottom: 0, maxHeight: 'none', borderRadius: 0, border: '0px solid transparent', display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', height: 'calc(100vh - 131px)' }}>
          {/* Box 1: Left side (3 columns) */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '24px' }}>
            {/* Script Selector */}
            <div style={{ 
              padding: '24px', 
              background: '#ffffff', 
              borderRadius: '12px', 
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Select Script</h4>
              <select
                value={currentAgentId || ''}
                onChange={(e) => {
                  const agentId = parseInt(e.target.value);
                  setCurrentAgentId(agentId);
                  const agent = agents.find(a => a.id === agentId);
                  if (agent) {
                    setFormData({ content: agent.content || '' });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">Select a script...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {/* 3-Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
              <button
                type="button"
                onClick={() => setActiveSimTab('setup')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeSimTab === 'setup' ? '3px solid #4B5CFF' : '3px solid transparent',
                  color: activeSimTab === 'setup' ? '#4B5CFF' : '#6b7280',
                  fontSize: '15px',
                  fontWeight: activeSimTab === 'setup' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                🎯 TEST SETUP
              </button>
              <button
                type="button"
                onClick={() => setActiveSimTab('run')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeSimTab === 'run' ? '3px solid #4B5CFF' : '3px solid transparent',
                  color: activeSimTab === 'run' ? '#4B5CFF' : '#6b7280',
                  fontSize: '15px',
                  fontWeight: activeSimTab === 'run' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                ▶️ RUN TEST
              </button>
              <button
                type="button"
                onClick={() => setActiveSimTab('advanced')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeSimTab === 'advanced' ? '3px solid #4B5CFF' : '3px solid transparent',
                  color: activeSimTab === 'advanced' ? '#6b7280',
                  fontSize: '15px',
                  fontWeight: activeSimTab === 'advanced' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                ⚙️ ADVANCED
              </button>
            </div>

            {/* TAB 1: TEST SETUP */}
            {activeSimTab === 'setup' && (
              <>
                {/* Pre-made Scenarios Section */}
                <div style={{ 
                  padding: '24px', 
                  background: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Section A: Quick Start (Pre-made)</h4>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Choose a pre-saved scenario or create your own</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {preMadeScenarios.map((item) => (
                      <label key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        border: selectedPreMade === item.id ? '2px solid #4B5CFF' : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedPreMade === item.id ? '#f0f4ff' : '#ffffff'
                      }}>
                        <input
                          type="radio"
                          name="premade"
                          checked={selectedPreMade === item.id}
                          onChange={() => {
                            setSelectedPreMade(item.id);
                            if (item.id !== 'custom') {
                              setScenario(item.scenario);
                            } else {
                              setScenario('');
                            }
                          }}
                          style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Setup Section */}
                {selectedPreMade === 'custom' && (
                  <div style={{ 
                    padding: '24px', 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1.5px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Section B: Custom Setup</h4>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '600', color: '#374151' }}>
                        Step 1: What Happened?
                      </label>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Write in simple words what the customer's situation is</p>
                      <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="Example: Customer ordered shoes but received wrong size..."
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#374151' }}>
                        Step 2: Pick Customer Types to Test
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { id: 'cooperative-english', label: '☐ Nice Customer (English)', personality: 'cooperative', lang: 'english' },
                          { id: 'cooperative-hindi', label: '☐ Nice Customer (Hindi)', personality: 'cooperative', lang: 'hindi' },
                          { id: 'confused-english', label: '☐ Confused Customer (English)', personality: 'confused', lang: 'english' },
                          { id: 'confused-hindi', label: '☐ Confused Customer (Hindi)', personality: 'confused', lang: 'hindi' },
                          { id: 'difficult-english', label: '☐ Angry Customer (English)', personality: 'difficult', lang: 'english' },
                          { id: 'difficult-hindi', label: '☐ Angry Customer (Hindi)', personality: 'difficult', lang: 'hindi' }
                        ].map((item) => (
                          <label key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedTestCases.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTestCases([...selectedTestCases, item.id]);
                                } else {
                                  setSelectedTestCases(selectedTestCases.filter(id => id !== item.id));
                                }
                              }}
                              style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', color: '#111827' }}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = ['cooperative-english', 'cooperative-hindi', 'confused-english', 'confused-hindi', 'difficult-english', 'difficult-hindi'];
                          setSelectedTestCases(allIds);
                        }}
                        style={{
                          marginTop: '12px',
                          padding: '8px 16px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: RUN TEST */}
            {activeSimTab === 'run' && (
              <>
                {/* Run Simulation Button */}
            <div style={{ 
              padding: '24px', 
              background: '#ffffff', 
              borderRadius: '12px', 
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Run Simulation</h4>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>
                Run thousands of simulations in minutes. Test your script against various customer scenarios and personalities. The system will simulate conversations and score them out of 10.
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!formData.content) {
                    alert('Please select a script first');
                    return;
                  }
                  setIsRunningEvaluation(true);
                  setEvaluationResults(null);
                  try {
                    const result = await api.runEvaluation({
                      scriptContent: formData.content,
                      variables: evaluationVariables,
                      extractorPrompt: extractorPrompt || null,
                      evaluatorPrompt: evaluatorPrompt || null,
                      testCasePrompt: testCasePrompt || null,
                      scenario: scenario || null,
                      personalityPrompts: personalityPrompts || null,
                      testCaseIds: selectedTestCases.length > 0 ? selectedTestCases : null,
                      maxPersonalitiesPerCase: 2,
                      languages: ['english', 'hindi']
                    });
                    if (result.success) {
                      setEvaluationResults(result.results);
                    }
                  } catch (error) {
                    console.error('Error running simulation:', error);
                    alert('Error running simulation: ' + error.message);
                  } finally {
                    setIsRunningEvaluation(false);
                  }
                }}
                disabled={isRunningEvaluation || !formData.content}
                style={{
                  padding: '10px 20px',
                  background: isRunningEvaluation || !formData.content ? '#d1d5db' : '#4B5CFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isRunningEvaluation || !formData.content ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isRunningEvaluation || !formData.content ? 'none' : '0 1px 2px rgba(75, 92, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!isRunningEvaluation && formData.content) {
                    e.currentTarget.style.background = '#3b4ae6';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(75, 92, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRunningEvaluation && formData.content) {
                    e.currentTarget.style.background = '#4B5CFF';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(75, 92, 255, 0.2)';
                  }
                }}
              >
                {isRunningEvaluation ? 'Running Simulation...' : 'Run Simulation'}
              </button>
            </div>

            {/* Template Variables Section */}
            <div style={{ 
              padding: '24px', 
              background: '#ffffff', 
              borderRadius: '12px', 
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Template Variables
              </h5>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>
                Set values for template variables used in the script (e.g., {'{customer_name}'}, {'{order_number}'}).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {Object.entries(evaluationVariables).map(([key, value]) => (
                  <div key={key}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setEvaluationVariables({ ...evaluationVariables, [key]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        background: '#ffffff'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#4B5CFF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75, 92, 255, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Results Section */}
            {evaluationResults && (
              <div>
                <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
                  Simulation Results
                </h5>
                <div style={{ 
                  padding: '24px', 
                  background: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Simulations</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                        {evaluationResults.summary.totalTests}
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Score</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                        {(evaluationResults.summary.averageScore ?? 0).toFixed(2)}/10
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passed ({'≥7'})</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                        {evaluationResults.summary.passed}
                      </div>
                    </div>
                    <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failed ({'<7'})</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                        {evaluationResults.summary.failed}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                  {evaluationResults.testResults.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1.5px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '4px' }}>
                            {result.testCaseName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {result.personality} • {result.language}
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          background: result.score >= 7 ? '#ecfdf5' : '#fef2f2',
                          color: result.score >= 7 ? '#10b981' : '#ef4444',
                          border: `1px solid ${result.score >= 7 ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {result.score}/10
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {result.evaluation}
                      </div>

                      {result.conversation && (
                        <details style={{ marginTop: '16px' }}>
                          <summary style={{ 
                            cursor: 'pointer', 
                            fontWeight: '500', 
                            fontSize: '14px', 
                            color: '#4B5CFF',
                            padding: '8px 0'
                          }}>
                            View Conversation
                          </summary>
                          <div style={{ 
                            marginTop: '12px', 
                            padding: '16px', 
                            background: '#f9fafb', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace'
                          }}>
                            {result.conversation}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}

            {/* TAB 3: ADVANCED */}
            {activeSimTab === 'advanced' && (
              <>
                <div style={{ 
                  padding: '16px 20px', 
                  background: '#fff3cd', 
                  borderRadius: '8px', 
                  border: '1px solid #ffc107',
                  marginBottom: '8px'
                }}>
                  <p style={{ fontSize: '14px', color: '#856404', margin: 0, fontWeight: '500' }}>
                    ⚠️ Advanced Settings - Only change if you know what you're doing
                  </p>
                </div>
              </p>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="e.g., you ordered a product yesterday and want to know the delivery status"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.getEvaluationDefaultPrompts();
                    if (res.success && res.scenario) {
                      setScenario(res.scenario);
                    }
                  } catch (error) {
                    console.error('Error loading default scenario:', error);
                  }
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Reset to Default
              </button>
            </div>

            {/* Select Scenarios Section */}
            <div style={{ 
              padding: '24px', 
              background: '#ffffff', 
              borderRadius: '12px', 
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h5 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Select Scenarios
              </h5>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
                Select which scenarios to simulate. Each scenario includes multiple personalities and languages.
              </p>
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '8px',
                background: '#f9fafb'
              }}>
                {testCases.map(tc => (
                  <label
                    key={tc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      transition: 'all 0.2s ease',
                      background: selectedTestCases.includes(tc.id) ? '#eff6ff' : '#ffffff',
                      border: selectedTestCases.includes(tc.id) ? '1px solid #4B5CFF' : '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedTestCases.includes(tc.id)) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedTestCases.includes(tc.id)) {
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestCases.includes(tc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTestCases([...selectedTestCases, tc.id]);
                        } else {
                          setSelectedTestCases(selectedTestCases.filter(id => id !== tc.id));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{tc.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {tc.personality ? `${tc.personality.charAt(0).toUpperCase() + tc.personality.slice(1)} • ${tc.language ? tc.language.charAt(0).toUpperCase() + tc.language.slice(1) : ''}` : (tc.baseScenario || 'Test Case')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Simulation Script Section */}
            <div>
              <h5 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                Simulation Script
              </h5>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Customize the prompts used for extracting rules and simulating conversations.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Extractor Prompt
                </label>
                <textarea
                  value={extractorPrompt}
                  onChange={(e) => setExtractorPrompt(e.target.value)}
                  placeholder="Enter extractor prompt..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.getEvaluationDefaultPrompts();
                      if (res.success) {
                        setExtractorPrompt(res.extractorPrompt);
                      }
                    } catch (error) {
                      console.error('Error loading default extractor prompt:', error);
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Default
                </button>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Simulator Prompt
                </label>
                <textarea
                  value={evaluatorPrompt}
                  onChange={(e) => setEvaluatorPrompt(e.target.value)}
                  placeholder="Enter evaluator prompt..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.getEvaluationDefaultPrompts();
                      if (res.success) {
                        setEvaluatorPrompt(res.evaluatorPrompt);
                      }
                    } catch (error) {
                      console.error('Error loading default evaluator prompt:', error);
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Default
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Test Case Prompt
                </label>
                <textarea
                  value={testCasePrompt}
                  onChange={(e) => setTestCasePrompt(e.target.value)}
                  placeholder="Enter test case prompt..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px', 
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.getEvaluationDefaultPrompts();
                      if (res.success) {
                        setTestCasePrompt(res.testCasePrompt);
                      }
                    } catch (error) {
                      console.error('Error loading default test case prompt:', error);
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Default
                </button>
              </div>
            </div>

            {/* Personality Prompts Section */}
            <div>
              <h5 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                Personality Prompts
              </h5>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Define how each personality type behaves. These prompts describe the customer's behavior and response style.
              </p>
              {Object.entries(personalityPrompts).map(([personality, prompt]) => (
                <div key={personality} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>
                    {personality}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPersonalityPrompts({ ...personalityPrompts, [personality]: e.target.value })}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunSimulation;

