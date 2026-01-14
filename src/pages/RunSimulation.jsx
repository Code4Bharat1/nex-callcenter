import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import './RunSimulation.css';

const RunSimulation = ({ shop, formData, agents, currentAgentId, setCurrentAgentId }) => {
  const [templateVariables, setTemplateVariables] = useState({
    customer_name: 'John',
    order_number: '12345',
    product_name: 'Wireless Headphones',
    delivery_date: 'Tomorrow',
    phone_number: '+91 98765 43210'
  });
  
  const [scenario, setScenario] = useState('you ordered a product from this website yesterday');
  
  const [personalities, setPersonalities] = useState([
    { id: 'cooperative', name: 'Cooperative', prompt: 'You are helpful and willing to engage. You answer questions directly and follow instructions.' },
    { id: 'difficult', name: 'Difficult', prompt: 'You are skeptical and challenging. You question things and need convincing.' },
    { id: 'confused', name: 'Confused', prompt: 'You are uncertain and need things explained multiple times. You ask for clarification often.' }
  ]);
  
  const [languages, setLanguages] = useState(['English', 'Hindi', 'Hinglish']);
  
  const [selectedTests, setSelectedTests] = useState({
    'English-Cooperative': true,
    'English-Difficult': true,
    'English-Confused': true,
    'Hindi-Cooperative': true,
    'Hindi-Difficult': false,
    'Hindi-Confused': true,
    'Hinglish-Cooperative': false,
    'Hinglish-Difficult': true,
    'Hinglish-Confused': true,
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddPersonality, setShowAddPersonality] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newPersonalityName, setNewPersonalityName] = useState('');
  const [newPersonalityPrompt, setNewPersonalityPrompt] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [extractorPrompt, setExtractorPrompt] = useState('');
  const [evaluatorPrompt, setEvaluatorPrompt] = useState('');
  const [testCasePrompt, setTestCasePrompt] = useState('');

  const [evaluationResults, setEvaluationResults] = useState(null);
  const evaluationDefaultsLoaded = useRef(false);

  useEffect(() => {
    if (!evaluationDefaultsLoaded.current) {
      loadDefaults();
      evaluationDefaultsLoaded.current = true;
    }
  }, []);

  const loadDefaults = async () => {
    try {
      const res = await fetch('/api/evaluation/default-prompts', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        if (data.extractorPrompt) setExtractorPrompt(data.extractorPrompt);
        if (data.evaluatorPrompt) setEvaluatorPrompt(data.evaluatorPrompt);
        if (data.testCasePrompt) setTestCasePrompt(data.testCasePrompt);
        if (data.scenario) setScenario(data.scenario);
        if (data.personalityPrompts) {
          const newPersonalities = Object.entries(data.personalityPrompts).map(([key, prompt]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            prompt
          }));
          setPersonalities(newPersonalities);
        }
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
    }
  };

  const toggleCell = (language, personalityName) => {
    const key = `${language}-${personalityName}`;
    setSelectedTests(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRow = (language) => {
    const newState = !personalities.every(p => selectedTests[`${language}-${p.name}`]);
    const updates = {};
    personalities.forEach(p => {
      updates[`${language}-${p.name}`] = newState;
    });
    setSelectedTests(prev => ({ ...prev, ...updates }));
  };

  const toggleColumn = (personalityName) => {
    const newState = !languages.every(l => selectedTests[`${l}-${personalityName}`]);
    const updates = {};
    languages.forEach(l => {
      updates[`${l}-${personalityName}`] = newState;
    });
    setSelectedTests(prev => ({ ...prev, ...updates }));
  };

  const selectAll = () => {
    const updates = {};
    languages.forEach(l => {
      personalities.forEach(p => {
        updates[`${l}-${p.name}`] = true;
      });
    });
    setSelectedTests(updates);
  };

  const deselectAll = () => {
    const updates = {};
    languages.forEach(l => {
      personalities.forEach(p => {
        updates[`${l}-${p.name}`] = false;
      });
    });
    setSelectedTests(updates);
  };

  const getStats = () => {
    if (!evaluationResults) return { ran: 0, passed: 0, failed: 0, avgScore: '0.0' };
    const ran = evaluationResults.summary?.totalTests || 0;
    const passed = evaluationResults.summary?.passed || 0;
    const avgScore = evaluationResults.summary?.averageScore?.toFixed(1) || '0.0';
    return { ran, passed, failed: ran - passed, avgScore };
  };

  const stats = getStats();

  const runSimulation = async () => {
    if (!formData?.content) {
      alert('Please select a script first');
      return;
    }

    setIsRunning(true);
    setEvaluationResults(null);

    try {
      const selectedTestCases = [];
      personalities.forEach(p => {
        languages.forEach(l => {
          if (selectedTests[`${l}-${p.name}`]) {
            selectedTestCases.push({ language: l.toLowerCase(), personality: p.id });
          }
        });
      });

      const result = await fetch('/api/evaluation/run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptContent: formData.content,
          variables: templateVariables,
          extractorPrompt,
          evaluatorPrompt,
          testCasePrompt,
          scenario,
          personalityPrompts: Object.fromEntries(personalities.map(p => [p.id, p.prompt])),
          testCaseIds: selectedTestCases.length > 0 ? selectedTestCases : null,
          maxPersonalitiesPerCase: 2,
          languages: languages.map(l => l.toLowerCase())
        })
      });

      const data = await result.json();
      
      if (data.success) {
        setEvaluationResults(data.results);
        setHasRun(true);
      } else {
        alert(data.error || 'Error running simulation');
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      alert('Error running simulation: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const resetPromptsToDefault = async () => {
    try {
      const res = await fetch('/api/evaluation/default-prompts', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        if (data.extractorPrompt) setExtractorPrompt(data.extractorPrompt);
        if (data.evaluatorPrompt) setEvaluatorPrompt(data.evaluatorPrompt);
        if (data.testCasePrompt) setTestCasePrompt(data.testCasePrompt);
        if (data.personalityPrompts) {
          const newPersonalities = Object.entries(data.personalityPrompts).map(([key, prompt]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            prompt
          }));
          setPersonalities(newPersonalities);
        }
      }
    } catch (error) {
      console.error('Error resetting prompts:', error);
    }
  };

  const getResult = (language, personalityName) => {
    if (evaluationResults?.testResults) {
      return evaluationResults.testResults.find(r => 
        r.language?.toLowerCase() === language.toLowerCase() && 
        r.personality?.toLowerCase() === personalityName.toLowerCase()
      );
    }
    return null;
  };

  return (
    <div className="run-simulation-page">
      <h1 className="run-simulation-title">Run Simulation</h1>

      <div className="run-sim-two-col">
        <div className="run-sim-section">
          <h2 className="run-sim-section-title">Step 1: Template Variables</h2>
          <div className="run-sim-vars-grid">
            {Object.keys(templateVariables).map((key) => (
              <div key={key}>
                <label className="run-sim-var-label">{key.replace(/_/g, ' ')}</label>
                <input
                  type="text"
                  value={templateVariables[key]}
                  onChange={(e) => setTemplateVariables({
                    ...templateVariables,
                    [key]: e.target.value
                  })}
                  className="run-sim-var-input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="run-sim-section">
          <h2 className="run-sim-section-title">Step 2: Scenario</h2>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="run-sim-textarea-full"
            placeholder="Describe the scenario..."
          />
        </div>
      </div>

      <div className="run-sim-table-container">
        <div className="run-sim-table-header">
          <div>
            <h2 className="run-sim-table-title">Step 3: Select Test Cases</h2>
            <p className="run-sim-table-subtitle">Choose which language and personality combinations to test</p>
          </div>
          <div className="run-sim-table-actions">
            <button onClick={selectAll} className="run-sim-table-btn">Select all</button>
            <button onClick={deselectAll} className="run-sim-table-btn">Clear</button>
            <button onClick={() => setShowAdvanced(true)} className="run-sim-adv-btn" title="Advanced settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span style={{ marginLeft: '6px', fontWeight: 500 }}>Advanced</span>
            </button>
          </div>
        </div>

        <table className="run-sim-table">
          <thead>
            <tr>
              <th>Language</th>
              {personalities.map((personality) => (
                <th key={personality.id} onClick={() => toggleColumn(personality.name)} className="run-sim-table-th-center">
                  {personality.name}
                </th>
              ))}
              <th style={{ width: '60px', padding: '12px 8px' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  <button className="run-sim-add-col-btn" onClick={() => setShowAddPersonality(true)} title="Add Personality (New Column)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button className="run-sim-add-col-btn" onClick={() => setShowAddLanguage(true)} title="Add Language (New Row)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {languages.map((language) => (
              <tr key={language} className="run-sim-table-row">
                <td onClick={() => toggleRow(language)}>{language}</td>
                {personalities.map((personality) => {
                  const key = `${language}-${personality.name}`;
                  const isSelected = selectedTests[key];
                  return (
                    <td key={personality.id} onClick={() => toggleCell(language, personality.name)} className="run-sim-table-td-center">
                      <div className={`run-sim-checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td style={{ width: '60px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="run-sim-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="run-sim-footer-text">{Object.values(selectedTests).filter(Boolean).length} test cases selected</span>
            <button onClick={() => setShowAddPersonality(true)} className="run-sim-add-personality-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Personality
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={resetPromptsToDefault} className="run-sim-reset-btn">Reset all</button>
            <button onClick={runSimulation} disabled={isRunning || !formData?.content} className="run-sim-run-btn">
              {isRunning ? 'Running simulation...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {hasRun && evaluationResults && (
        <div className="run-sim-table-container">
          <div className="run-sim-results-header">
            <div>
              <h2 className="run-sim-table-title">Step 4: Results</h2>
              <p className="run-sim-table-subtitle">Click any cell to view detailed analysis</p>
            </div>
            <div className="run-sim-results-stats">
              <div className="run-sim-stat">
                <span className="run-sim-stat-value">{stats.ran}</span>
                <span className="run-sim-stat-label">Tests</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }}></div>
              <div className="run-sim-stat">
                <span className="run-sim-stat-value green">{stats.passed}</span>
                <span className="run-sim-stat-label">Passed</span>
              </div>
              <div className="run-sim-stat">
                <span className="run-sim-stat-value red">{stats.failed}</span>
                <span className="run-sim-stat-label">Failed</span>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }}></div>
              <div className="run-sim-stat">
                <span className="run-sim-stat-value blue">{stats.avgScore}</span>
                <span className="run-sim-stat-label">Avg</span>
              </div>
            </div>
          </div>

          <table className="run-sim-table">
            <thead>
              <tr>
                <th>Language</th>
                {personalities.map((personality) => (
                  <th key={personality.id} className="run-sim-table-th-center">{personality.name}</th>
                ))}
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language) => (
                <tr key={language} className="run-sim-table-row">
                  <td>{language}</td>
                  {personalities.map((personality) => {
                    const result = getResult(language, personality.name);
                    const wasSelected = selectedTests[`${language}-${personality.name}`];
                    return (
                      <td key={personality.id} className="run-sim-table-td-center"
                        onClick={() => result && setSelectedDetail({ language, personality: personality.name, ...result, score: result.score ?? result.evaluation?.overallScore ?? 0 })}
                        style={{ cursor: wasSelected && result ? 'pointer' : 'default' }}>
                        {!wasSelected ? (
                          <span className="run-sim-not-run">Not run</span>
                        ) : result ? (
                          <span className={`run-sim-score-badge ${result.passed ? 'passed' : 'failed'}`}>
                            {result.passed ? '✓' : '✗'} {((result.score ?? result.evaluation?.overallScore) ?? 0).toFixed(1)}
                          </span>
                        ) : (
                          <span className="run-sim-not-run">Pending</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ width: '60px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddLanguage && (
        <>
          <div className="run-sim-modal-overlay" onClick={() => setShowAddLanguage(false)}></div>
          <div className="run-sim-modal" style={{ maxWidth: '400px' }}>
            <div className="run-sim-modal-header">
              <h3 className="run-sim-modal-title">Add Language</h3>
              <button className="run-sim-modal-close" onClick={() => setShowAddLanguage(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="run-sim-modal-body">
              <div className="run-sim-adv-section" style={{ marginBottom: 0 }}>
                <label className="run-sim-var-label">Language Name</label>
                <input
                  type="text"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  className="run-sim-var-input"
                  placeholder="e.g., Tamil, Bengali, Marathi"
                />
              </div>
            </div>
            <div className="run-sim-modal-footer">
              <button onClick={() => setShowAddLanguage(false)} className="run-sim-reset-btn">Cancel</button>
              <button
                onClick={() => {
                  if (newLanguageName.trim()) {
                    const lang = newLanguageName.trim().charAt(0).toUpperCase() + newLanguageName.trim().slice(1);
                    if (!languages.includes(lang)) {
                      setLanguages([...languages, lang]);
                      const newLang = lang;
                      personalities.forEach(p => {
                        setSelectedTests(prev => ({ ...prev, [`${newLang}-${p.name}`]: false }));
                      });
                    }
                    setNewLanguageName('');
                    setShowAddLanguage(false);
                  }
                }}
                className="run-sim-run-btn"
              >
                Add Language
              </button>
            </div>
          </div>
        </>
      )}

      {showAddPersonality && (
        <>
          <div className="run-sim-modal-overlay" onClick={() => { setShowAddPersonality(false); setNewPersonalityPrompt(''); }}>
          </div>
          <div className="run-sim-modal" style={{ maxWidth: '500px' }}>
            <div className="run-sim-modal-header">
              <h3 className="run-sim-modal-title">Add Personality</h3>
              <button className="run-sim-modal-close" onClick={() => { setShowAddPersonality(false); setNewPersonalityPrompt(''); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="run-sim-modal-body">
              <div className="run-sim-adv-section" style={{ marginBottom: '16px' }}>
                <label className="run-sim-var-label">Personality Name</label>
                <input
                  type="text"
                  value={newPersonalityName}
                  onChange={(e) => setNewPersonalityName(e.target.value)}
                  className="run-sim-var-input"
                  placeholder="e.g., Aggressive, Friendly, Hesitant"
                />
              </div>
              <div className="run-sim-adv-section" style={{ marginBottom: 0 }}>
                <label className="run-sim-var-label">Personality Prompt</label>
                <textarea
                  value={newPersonalityPrompt}
                  onChange={(e) => setNewPersonalityPrompt(e.target.value)}
                  className="run-sim-adv-textarea"
                  style={{ height: '120px' }}
                  placeholder="Describe how this personality behaves during the conversation..."
                />
              </div>
            </div>
            <div className="run-sim-modal-footer">
              <button onClick={() => { setShowAddPersonality(false); setNewPersonalityPrompt(''); }} className="run-sim-reset-btn">Cancel</button>
              <button
                onClick={() => {
                  if (newPersonalityName.trim() && newPersonalityPrompt.trim()) {
                    const pers = newPersonalityName.trim().charAt(0).toUpperCase() + newPersonalityName.trim().slice(1);
                    const id = pers.toLowerCase();
                    if (!personalities.find(p => p.id === id)) {
                      setPersonalities([...personalities, { id, name: pers, prompt: newPersonalityPrompt.trim() }]);
                      languages.forEach(l => {
                        setSelectedTests(prev => ({ ...prev, [`${l}-${pers}`]: false }));
                      });
                    }
                    setNewPersonalityName('');
                    setNewPersonalityPrompt('');
                    setShowAddPersonality(false);
                  }
                }}
                className="run-sim-run-btn"
              >
                Add Personality
              </button>
            </div>
          </div>
        </>
      )}

      {showAdvanced && (
        <>
          <div className="run-sim-modal-overlay" onClick={() => setShowAdvanced(false)}></div>
          <div className="run-sim-modal">
            <div className="run-sim-modal-header">
              <div>
                <h3 className="run-sim-modal-title">Advanced Settings</h3>
                <p className="run-sim-modal-subtitle">Customize prompts for simulation and evaluation</p>
              </div>
              <button className="run-sim-modal-close" onClick={() => setShowAdvanced(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="run-sim-modal-body">
              <div className="run-sim-adv-section">
                <div className="run-sim-adv-header">
                  <div>
                    <h4 className="run-sim-adv-section-title">Extractor Prompt</h4>
                    <p className="run-sim-adv-section-desc">Defines how to extract evaluation criteria from your script</p>
                  </div>
                  <button onClick={async () => {
                    const res = await fetch('/api/evaluation/default-prompts', { credentials: 'include' });
                    const data = await res.json();
                    if (data.success && data.extractorPrompt) setExtractorPrompt(data.extractorPrompt);
                  }} className="run-sim-adv-reset-btn">Reset to Default</button>
                </div>
                <textarea value={extractorPrompt} onChange={(e) => setExtractorPrompt(e.target.value)} className="run-sim-adv-textarea" />
              </div>

              <div className="run-sim-adv-section">
                <div className="run-sim-adv-header">
                  <div>
                    <h4 className="run-sim-adv-section-title">Evaluator Prompt</h4>
                    <p className="run-sim-adv-section-desc">Defines how conversations are evaluated and scored</p>
                  </div>
                  <button onClick={async () => {
                    const res = await fetch('/api/evaluation/default-prompts', { credentials: 'include' });
                    const data = await res.json();
                    if (data.success && data.evaluatorPrompt) setEvaluatorPrompt(data.evaluatorPrompt);
                  }} className="run-sim-adv-reset-btn">Reset to Default</button>
                </div>
                <textarea value={evaluatorPrompt} onChange={(e) => setEvaluatorPrompt(e.target.value)} className="run-sim-adv-textarea" />
              </div>

              <div className="run-sim-adv-section">
                <div className="run-sim-adv-header">
                  <div>
                    <h4 className="run-sim-adv-section-title">Test Case Prompt</h4>
                    <p className="run-sim-adv-section-desc">Defines how customer responses are generated during simulation</p>
                  </div>
                  <button onClick={async () => {
                    const res = await fetch('/api/evaluation/default-prompts', { credentials: 'include' });
                    const data = await res.json();
                    if (data.success && data.testCasePrompt) setTestCasePrompt(data.testCasePrompt);
                  }} className="run-sim-adv-reset-btn">Reset to Default</button>
                </div>
                <textarea value={testCasePrompt} onChange={(e) => setTestCasePrompt(e.target.value)} className="run-sim-adv-textarea" />
              </div>

              <div className="run-sim-adv-section">
                <div className="run-sim-adv-header" style={{ marginBottom: '16px' }}>
                  <div>
                    <h4 className="run-sim-adv-section-title">Personality Prompts</h4>
                    <p className="run-sim-adv-section-desc">Define how different customer personalities behave during simulation</p>
                  </div>
                  <button onClick={resetPromptsToDefault} className="run-sim-adv-reset-btn">Reset All to Default</button>
                </div>
                {personalities.map((personality) => (
                  <div key={personality.id} className="run-sim-adv-personality">
                    <label className="run-sim-adv-personality-label">{personality.name}</label>
                    <textarea
                      value={personality.prompt}
                      onChange={(e) => {
                        const updated = personalities.map(p => p.id === personality.id ? { ...p, prompt: e.target.value } : p);
                        setPersonalities(updated);
                      }}
                      className="run-sim-adv-textarea"
                      style={{ height: '80px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="run-sim-modal-footer">
              <button onClick={() => setShowAdvanced(false)} className="run-sim-modal-done-btn">Done</button>
            </div>
          </div>
        </>
      )}

      {selectedDetail && (
        <>
          <div className="run-sim-modal-overlay" onClick={() => setSelectedDetail(null)}></div>
          <div className="run-sim-detail-modal">
            <div className="run-sim-detail-header">
              <div>
                <h3 className="run-sim-detail-title">{selectedDetail.language} - {selectedDetail.personality}</h3>
                <div className="run-sim-detail-tags">
                  <span className={`run-sim-detail-badge ${selectedDetail.passed ? 'passed' : 'failed'}`}>
                    {selectedDetail.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                  <span className="run-sim-detail-score">Score: {((selectedDetail.score ?? 0)).toFixed(1)}/10</span>
                </div>
              </div>
              <button className="run-sim-modal-close" onClick={() => setSelectedDetail(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="run-sim-detail-body">
              {selectedDetail.evaluation?.feedback && (
                <>
                  {selectedDetail.evaluation.feedback.strengths && selectedDetail.evaluation.feedback.strengths.length > 0 && (
                    <div className="run-sim-detail-section">
                      <div className="run-sim-detail-section-title green">
                        <div className="run-sim-detail-indicator green"></div>
                        Strengths
                      </div>
                      <div className="run-sim-detail-list">
                        {selectedDetail.evaluation.feedback.strengths.map((strength, i) => (
                          <div key={i} className="run-sim-detail-list-item">
                            <svg className="run-sim-detail-list-icon green" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDetail.evaluation.feedback.weaknesses && selectedDetail.evaluation.feedback.weaknesses.length > 0 && (
                    <div className="run-sim-detail-section">
                      <div className="run-sim-detail-section-title red">
                        <div className="run-sim-detail-indicator red"></div>
                        Weaknesses
                      </div>
                      <div className="run-sim-detail-list red">
                        {selectedDetail.evaluation.feedback.weaknesses.map((weakness, i) => (
                          <div key={i} className="run-sim-detail-list-item red">
                            <svg className="run-sim-detail-list-icon red" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {weakness}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedDetail.conversation && selectedDetail.conversation.length > 0 && (
                <div className="run-sim-detail-section">
                  <div className="run-sim-detail-section-title blue">
                    <div className="run-sim-detail-indicator blue"></div>
                    Conversation Transcript
                  </div>
                  <div className="run-sim-detail-transcript">
                    {selectedDetail.conversation.map((msg, i) => (
                      <div key={i} className={`run-sim-transcript-msg ${msg.role === 'agent' ? 'agent' : 'customer'}`}>
                        <div className={`run-sim-transcript-role ${msg.role === 'customer' ? 'customer' : ''}`}>
                          {msg.role === 'agent' ? 'Agent' : 'Customer'}
                        </div>
                        <div className="run-sim-transcript-text">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RunSimulation;
