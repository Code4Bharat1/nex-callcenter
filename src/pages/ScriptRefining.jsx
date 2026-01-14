import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './ScriptRefining.css';

const ScriptRefining = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [scripts, setScripts] = useState([]);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('phrasing'); // 'phrasing', 'way-of-replying', 'review'
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalTalks: 0,
    refinedCount: 0,
    conversionRate: 0
  });
  
  // Analysis results
  const [phrases, setPhrases] = useState([]);
  const [qaPairs, setQaPairs] = useState([]);
  const [transcriptCount, setTranscriptCount] = useState(15);
  
  // Notes
  const [phrasingNote, setPhrasingNote] = useState('');
  const [wayOfReplyingNote, setWayOfReplyingNote] = useState('');
  const [savedPhrasingNotes, setSavedPhrasingNotes] = useState([]);
  const [savedWayOfReplyingNotes, setSavedWayOfReplyingNotes] = useState([]);
  
  // Examples (from Review tab)
  const [phrasingExamples, setPhrasingExamples] = useState([]);
  const [wayOfReplyingExamples, setWayOfReplyingExamples] = useState([]);
  const [generatingExamples, setGeneratingExamples] = useState(false);

  // Graph data
  const [turnsDistribution, setTurnsDistribution] = useState([]);
  const [durationDistribution, setDurationDistribution] = useState([]);
  const [durationJump, setDurationJump] = useState(30); // Default 30 seconds
  const [turnsChartInstance, setTurnsChartInstance] = useState(null);
  const [durationChartInstance, setDurationChartInstance] = useState(null);
  const turnsChartRef = useRef(null);
  const durationChartRef = useRef(null);

  useEffect(() => {
    if (shop) {
      loadScripts();
    }
  }, [shop]);

  useEffect(() => {
    if (selectedScriptId) {
      loadScriptData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScriptId, shop, durationJump]);

  const loadScripts = async () => {
    try {
      const response = await api.getScripts(shop);
      const scriptsArray = response?.scripts || response || [];
      setScripts(scriptsArray);
      
      if (scriptsArray.length > 0 && !selectedScriptId) {
        setSelectedScriptId(scriptsArray[0].id);
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScriptData = async () => {
    if (!selectedScriptId || !shop) return;
    
    try {
      setLoading(true);
      
      // Load script details and metrics
      const response = await fetch(`/api/script-refinement-data?scriptId=${selectedScriptId}&shop=${encodeURIComponent(shop)}&durationJump=${durationJump}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setSelectedScript(data.script);
        setMetrics({
          totalTalks: data.metrics.totalTalks || 0,
          refinedCount: data.metrics.refinedCount || 0,
          conversionRate: data.metrics.conversionRate || 0
        });
        setSavedPhrasingNotes(data.phrasingNotes || []);
        setSavedWayOfReplyingNotes(data.wayOfReplyingNotes || []);
        setPhrasingExamples(data.phrasingExamples || []);
        setWayOfReplyingExamples(data.wayOfReplyingExamples || []);
        
        // Set graph data
        setTurnsDistribution(data.graphs?.turnsDistribution || []);
        setDurationDistribution(data.graphs?.durationDistribution || []);
      }
    } catch (error) {
      console.error('Error loading script data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render charts when graph data changes
  useEffect(() => {
    if (!turnsDistribution.length && !durationDistribution.length) return;

    // Load Chart.js if not available
    if (typeof window.Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js';
      script.onload = () => renderCharts();
      document.head.appendChild(script);
    } else {
      renderCharts();
    }

    function renderCharts() {
      if (typeof window.Chart === 'undefined') return;

      // Destroy existing charts
      if (turnsChartInstance) turnsChartInstance.destroy();
      if (durationChartInstance) durationChartInstance.destroy();

      // Render turns frequency distribution
      if (turnsChartRef.current && turnsDistribution.length > 0) {
        const ctx = turnsChartRef.current.getContext('2d');
        const labels = turnsDistribution.map(d => `${d.turns} turns`);
        const data = turnsDistribution.map(d => d.count);

        const chart = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Number of Calls',
              data: data,
              borderColor: '#4B5CFF',
              backgroundColor: 'rgba(75, 92, 255, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Total Turns in Call Frequency Distribution'
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
              x: { title: { display: true, text: 'Number of Turns' } }
            }
          }
        });
        setTurnsChartInstance(chart);
      }

      // Render duration frequency distribution
      if (durationChartRef.current && durationDistribution.length > 0) {
        const ctx = durationChartRef.current.getContext('2d');
        const labels = durationDistribution.map(d => d.range + 's');
        const data = durationDistribution.map(d => d.count);

        const chart = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Number of Calls',
              data: data,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Total Call Duration Frequency Distribution'
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
              x: { title: { display: true, text: 'Duration Range (seconds)' } }
            }
          }
        });
        setDurationChartInstance(chart);
      }
    }

    return () => {
      if (turnsChartInstance) turnsChartInstance.destroy();
      if (durationChartInstance) durationChartInstance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnsDistribution, durationDistribution]);

  const handleAnalyze = async () => {
    if (!selectedScriptId || !shop) {
      alert('Please select a script first');
      return;
    }
    
    try {
      setAnalyzing(true);
      
      const response = await fetch(`/api/script-refinement-analyze`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScriptId,
          shop: shop,
          transcriptCount: transcriptCount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPhrases(data.phrases || []);
        setQaPairs(data.qaPairs || []);
        alert(`Analysis complete! Found ${data.phrases.length} unique phrases and ${data.qaPairs.length} Q&A pairs.`);
      } else {
        alert(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing:', error);
      alert('Error analyzing transcripts');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSavePhrasingNote = async () => {
    if (!phrasingNote.trim() || !selectedScriptId) return;
    
    try {
      const response = await fetch(`/api/script-refinement-note`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScriptId,
          type: 'phrasing',
          note: phrasingNote
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSavedPhrasingNotes([...savedPhrasingNotes, data.note]);
        setPhrasingNote('');
        alert('Note saved successfully');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note');
    }
  };

  const handleSaveWayOfReplyingNote = async () => {
    if (!wayOfReplyingNote.trim() || !selectedScriptId) return;
    
    try {
      const response = await fetch(`/api/script-refinement-note`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScriptId,
          type: 'way_of_replying',
          note: wayOfReplyingNote
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSavedWayOfReplyingNotes([...savedWayOfReplyingNotes, data.note]);
        setWayOfReplyingNote('');
        alert('Note saved successfully');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note');
    }
  };

  const handleGenerateExamples = async (type) => {
    if (!selectedScriptId) return;
    
    try {
      setGeneratingExamples(true);
      
      const response = await fetch(`/api/script-refinement-generate-examples`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScriptId,
          type: type // 'phrasing' or 'way_of_replying'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (type === 'phrasing') {
          setPhrasingExamples(data.examples || []);
        } else {
          setWayOfReplyingExamples(data.examples || []);
        }
        alert('Examples generated successfully');
      } else {
        alert(data.error || 'Failed to generate examples');
      }
    } catch (error) {
      console.error('Error generating examples:', error);
      alert('Error generating examples');
    } finally {
      setGeneratingExamples(false);
    }
  };

  if (loading && !selectedScript) {
    return <div className="script-refining-container">Loading...</div>;
  }

  return (
    <div className="script-refining-container">
      <div className="script-refining-header">
        <h1>Script Refiner</h1>
        <p className="subtitle">Prompt Refining</p>
      </div>

      {/* Script Selector */}
      <div className="script-selector-section">
        <label htmlFor="script-select">Select Script</label>
        <select
          id="script-select"
          value={selectedScriptId || ''}
          onChange={(e) => setSelectedScriptId(parseInt(e.target.value))}
          className="script-select"
        >
          <option value="">-- Select a script --</option>
          {scripts.map(script => (
            <option key={script.id} value={script.id}>
              {script.name}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-cards">
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTalks}</div>
          <div className="metric-label">TOTAL TALKS</div>
          <div className="metric-subtext">(happened with script after last refined)</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.refinedCount}</div>
          <div className="metric-label">REFINED</div>
          <div className="metric-subtext">times</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.conversionRate.toFixed(1)}%</div>
          <div className="metric-label">CONVERSION RATE</div>
          <div className="metric-subtext">(after last refined)</div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="graphs-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="graph-container" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <canvas ref={turnsChartRef} style={{ maxHeight: '300px' }}></canvas>
        </div>
        <div className="graph-container" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Duration Jump (seconds):
            </label>
            <input
              type="number"
              min="10"
              max="300"
              step="10"
              value={durationJump}
              onChange={(e) => {
                const newJump = parseInt(e.target.value) || 30;
                setDurationJump(newJump);
              }}
              style={{
                width: '80px',
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <canvas ref={durationChartRef} style={{ maxHeight: '300px' }}></canvas>
        </div>
      </div>

      {/* Analyze Section */}
      <div className="analyze-section">
        <div className="analyze-controls">
          <label>
            Transcripts to analyze:
            <input
              type="number"
              min="1"
              max="100"
              value={transcriptCount}
              onChange={(e) => setTranscriptCount(parseInt(e.target.value) || 15)}
              className="transcript-count-input"
            />
          </label>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !selectedScriptId}
            className="analyze-button"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'phrasing' ? 'active' : ''}`}
            onClick={() => setActiveTab('phrasing')}
          >
            Phrasing
          </button>
          <button
            className={`tab ${activeTab === 'way-of-replying' ? 'active' : ''}`}
            onClick={() => setActiveTab('way-of-replying')}
          >
            Way of Replying
          </button>
          <button
            className={`tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Phrasing Tab */}
          {activeTab === 'phrasing' && (
            <div className="phrasing-tab">
              <div className="two-column-layout">
                <div className="left-column">
                  <h3>Unique Phrases Spoken by Agent</h3>
                  <div className="phrases-list">
                    {phrases.length === 0 ? (
                      <p className="empty-state">No phrases extracted yet. Click "Analyze" to extract phrases from transcripts.</p>
                    ) : (
                      phrases.map((phrase, idx) => (
                        <div key={idx} className="phrase-item">
                          {phrase}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="right-column">
                  <div className="note-taker-widget">
                    <h4>Note Taker (Phrasing)</h4>
                    <textarea
                      value={phrasingNote}
                      onChange={(e) => setPhrasingNote(e.target.value)}
                      placeholder="Write feelings about phrasing..."
                      className="note-textarea"
                      rows="8"
                    />
                    <button
                      onClick={handleSavePhrasingNote}
                      disabled={!phrasingNote.trim()}
                      className="save-note-button"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Way of Replying Tab */}
          {activeTab === 'way-of-replying' && (
            <div className="way-of-replying-tab">
              <div className="two-column-layout">
                <div className="left-column">
                  <h3>Unique Q&A Pairs</h3>
                  <div className="qa-pairs-list">
                    {qaPairs.length === 0 ? (
                      <p className="empty-state">No Q&A pairs extracted yet. Click "Analyze" to extract Q&A pairs from transcripts.</p>
                    ) : (
                      qaPairs.map((pair, idx) => (
                        <div key={idx} className="qa-pair-item">
                          <div className="customer-question">
                            <strong>Customer:</strong> {pair.customer}
                          </div>
                          <div className="agent-reply">
                            <strong>Agent:</strong> {pair.agent}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="right-column">
                  <div className="note-taker-widget">
                    <h4>Note Taker (Way of Replying)</h4>
                    <textarea
                      value={wayOfReplyingNote}
                      onChange={(e) => setWayOfReplyingNote(e.target.value)}
                      placeholder="Write feelings about way of replying..."
                      className="note-textarea"
                      rows="8"
                    />
                    <button
                      onClick={handleSaveWayOfReplyingNote}
                      disabled={!wayOfReplyingNote.trim()}
                      className="save-note-button"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="review-tab">
              {/* Phrasing Notes Section */}
              <div className="review-section">
                <h3>Phrasing Notes</h3>
                {savedPhrasingNotes.length === 0 ? (
                  <p className="empty-state">No notes saved yet</p>
                ) : (
                  <div className="notes-list">
                    {savedPhrasingNotes.map((note, idx) => (
                      <div key={idx} className="saved-note">
                        {note.note}
                        <span className="note-date">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="affect-section">
                  <h4>Affect</h4>
                  {phrasingExamples.length === 0 ? (
                    <div>
                      <p>GPT produced: Currently X kind of phrase will be Y kind of</p>
                      <p className="empty-state">No examples generated yet. Click 'Fix' to generate.</p>
                      <button
                        onClick={() => handleGenerateExamples('phrasing')}
                        disabled={generatingExamples || savedPhrasingNotes.length === 0}
                        className="fix-button"
                      >
                        {generatingExamples ? 'Generating...' : 'Fix'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p>GPT produced: Currently X kind of phrase will be Y kind of</p>
                      <div className="examples-list">
                        {phrasingExamples.map((example, idx) => (
                          <div key={idx} className="example-item">
                            {example.example}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleGenerateExamples('phrasing')}
                        disabled={generatingExamples}
                        className="fix-button"
                      >
                        {generatingExamples ? 'Generating...' : 'Fix'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Way of Replying Notes Section */}
              <div className="review-section">
                <h3>Way of Replying Notes</h3>
                {savedWayOfReplyingNotes.length === 0 ? (
                  <p className="empty-state">No notes saved yet</p>
                ) : (
                  <div className="notes-list">
                    {savedWayOfReplyingNotes.map((note, idx) => (
                      <div key={idx} className="saved-note">
                        {note.note}
                        <span className="note-date">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="affect-section">
                  <h4>Affect</h4>
                  {wayOfReplyingExamples.length === 0 ? (
                    <div>
                      <p>GPT produced: Currently X kind of reply will be replied like this</p>
                      <p className="empty-state">No examples generated yet. Click 'Fix' to generate.</p>
                      <button
                        onClick={() => handleGenerateExamples('way_of_replying')}
                        disabled={generatingExamples || savedWayOfReplyingNotes.length === 0}
                        className="fix-button"
                      >
                        {generatingExamples ? 'Generating...' : 'Fix'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p>GPT produced: Currently X kind of reply will be replied like this</p>
                      <div className="examples-list">
                        {wayOfReplyingExamples.map((example, idx) => (
                          <div key={idx} className="example-item">
                            {example.example}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleGenerateExamples('way_of_replying')}
                        disabled={generatingExamples}
                        className="fix-button"
                      >
                        {generatingExamples ? 'Generating...' : 'Fix'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptRefining;
