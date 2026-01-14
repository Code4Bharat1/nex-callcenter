import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './TimeCalculator.css';

const TimeCalculator = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [numberOfCalls, setNumberOfCalls] = useState('1000');
  const [channels, setChannels] = useState('50');
  const [pickupRate, setPickupRate] = useState('60');
  const [numberOfRetries, setNumberOfRetries] = useState(3);
  const [timeBetweenRetries, setTimeBetweenRetries] = useState(60);
  const [timePerCall, setTimePerCall] = useState('2.5');
  
  const [results, setResults] = useState([]);

  useEffect(() => {
    calculateResults();
  }, [numberOfCalls, channels, pickupRate, numberOfRetries, timePerCall]);

  const calculateResults = () => {
    const calls = parseFloat(numberOfCalls) || 0;
    const orders = parseFloat(channels) || 0;
    const rate = parseFloat(pickupRate) || 0;

    if (calls <= 0 || orders <= 0 || rate <= 0 || rate > 100) {
      setResults([]);
      return;
    }

    const pickupRateDecimal = rate > 1 ? rate / 100 : rate;
    
    const calculatedResults = [];
    let pendingCalls = calls;
    let totalCallsInitiated = 0;
    let totalCallsCompleted = 0;

    for (let retry = 1; retry <= numberOfRetries; retry++) {
      const callsCompletedThisRetry = Math.round(pendingCalls * pickupRateDecimal);
      const callsInitiatedThisRetry = pendingCalls;
      
      totalCallsCompleted += callsCompletedThisRetry;
      totalCallsInitiated += callsInitiatedThisRetry;
      
      pendingCalls = pendingCalls - callsCompletedThisRetry;
      
      calculatedResults.push({
        retry: retry,
        callsConverted: callsCompletedThisRetry,
        callsInitiated: callsInitiatedThisRetry,
        pendingCalls: pendingCalls
      });
    }

    setResults(calculatedResults);
  };

  const handleRetriesChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= 20) {
      setNumberOfRetries(value);
    }
  };

  const totalTime = numberOfRetries > 0 ? (numberOfRetries - 1) * timeBetweenRetries : 0;
  const totalTimeHours = Math.floor(totalTime / 60);
  const totalTimeMinutes = totalTime % 60;
  
  const totalConverted = results.reduce((sum, result) => sum + result.callsConverted, 0);
  const totalPending = results.length > 0 ? results[results.length - 1].pendingCalls : 0;
  
  const timePerCallMinutes = parseFloat(timePerCall) || 0;
  const totalCallTime = totalConverted * timePerCallMinutes;
  const totalCallTimeHours = Math.floor(totalCallTime / 60);
  const totalCallTimeMinutes = Math.round(totalCallTime % 60);

  return (
    <div className="time-calculator-page">
      <div className="time-calculator-container">
        <div className="calculator-header">
          <h1 className="calculator-title">Time Calculator</h1>
          <p className="calculator-subtitle">Calculate call times and retry schedules based on your parameters</p>
        </div>
        
        <div className="calculator-section">
          <h2 className="section-title">Parameters</h2>
          <div className="inputs-grid">
            <div className="input-group">
              <label htmlFor="numberOfCalls">Number of Calls</label>
              <input
                type="number"
                id="numberOfCalls"
                value={numberOfCalls}
                onChange={(e) => setNumberOfCalls(e.target.value)}
                placeholder="1000"
                min="1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="channels">Channels (Number of Orders)</label>
              <input
                type="number"
                id="channels"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                placeholder="50"
                min="1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="pickupRate">Pickup Rate (%)</label>
              <input
                type="number"
                id="pickupRate"
                value={pickupRate}
                onChange={(e) => setPickupRate(e.target.value)}
                placeholder="60"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="numberOfRetries">Number of Retries</label>
              <input
                type="number"
                id="numberOfRetries"
                value={numberOfRetries}
                onChange={handleRetriesChange}
                min="1"
                max="20"
              />
            </div>

            <div className="input-group">
              <label htmlFor="timeBetweenRetries">Time Between Retries (minutes)</label>
              <input
                type="number"
                id="timeBetweenRetries"
                value={timeBetweenRetries}
                onChange={(e) => setTimeBetweenRetries(parseInt(e.target.value) || 60)}
                min="1"
              />
            </div>

            <div className="input-group">
              <label htmlFor="timePerCall">Time Per Call Talk (minutes)</label>
              <input
                type="number"
                id="timePerCall"
                value={timePerCall}
                onChange={(e) => setTimePerCall(e.target.value)}
                placeholder="2.5"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <>
            <div className="calculator-section" style={{ marginTop: '24px' }}>
              <h2 className="section-title">Results</h2>
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Retry #</th>
                      <th>Calls Converted</th>
                      <th>Calls Initiated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td className="retry-number">{result.retry}</td>
                        <td className="converted-value">{result.callsConverted.toLocaleString()}</td>
                        <td>{result.callsInitiated.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td className="total-label">Total</td>
                      <td className="total-converted">{totalConverted.toLocaleString()}</td>
                      <td className="total-pending">
                        <span className="pending-text">Pending: </span>
                        <span className="pending-number">{totalPending.toLocaleString()}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {(timePerCall || totalTime > 0) && (
              <div className="calculator-section" style={{ marginTop: '24px' }}>
                <div className="summary-bar" style={{ marginTop: 0, padding: 0 }}>
                <div className="summary-item">
                  <span className="summary-label">Total Call Time</span>
                  <span className="summary-value">
                    {totalCallTimeHours > 0 && `${totalCallTimeHours}h `}
                    {totalCallTimeMinutes > 0 && `${totalCallTimeMinutes}m`}
                    {totalCallTime === 0 && '0m'}
                  </span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                  <span className="summary-label">Total Retry Time</span>
                  <span className="summary-value">
                    {totalTimeHours > 0 && `${totalTimeHours}h `}
                    {totalTimeMinutes > 0 && `${totalTimeMinutes}m`}
                    {totalTime === 0 && '0m'}
                  </span>
                </div>
                </div>
              </div>
            )}
          </>
        )}

        {numberOfCalls && channels && pickupRate && results.length === 0 && (
          <div className="error-message">
            Please enter valid values. Pickup rate should be between 0 and 100.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeCalculator;
