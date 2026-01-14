import React, { useState, useMemo } from 'react';
import './Info.css';

const Info = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('script-variables');

  const sections = {
    'script-variables': {
      title: 'Script Variables',
      content: `Script variables allow you to personalize your call scripts with dynamic information from each order. Use these variables in your script content, and they will be automatically replaced with actual order data when making calls.

Available Variables:
• [ORDER_NUMBER] - The order number (e.g., #1038)
• [ORDER_AMOUNT] - The total order amount with currency
• [CUSTOMER_NAME] - The customer's full name
• [CUSTOMER_ADDRESS] - The complete delivery address
• [DELIVERY_DATE] - The expected or actual delivery date

Usage Example:
"Hello [CUSTOMER_NAME], this is regarding your order [ORDER_NUMBER] for [ORDER_AMOUNT]. We wanted to confirm your delivery address: [CUSTOMER_ADDRESS]."

The system will automatically replace these variables with the actual values from the order when the call is made.`
    },
    'clone-voice': {
      title: 'How to Mirror Your Voice',
      content: `Voice cloning allows you to create a custom AI voice that sounds like you. This feature uses advanced AI technology to replicate your voice characteristics.

Steps to Clone Your Voice:

1. Navigate to the Clone Voice page
2. Choose your input method:
   - Record directly using your microphone
   - Upload an audio file (WAV, MP3, or WebM format)

3. For Recording:
   - Click "Start Recording" and speak clearly
   - Read the sample text provided or use your own
   - Click "Stop Recording" when finished
   - Minimum recommended: 10-15 seconds of clear audio

4. For File Upload:
   - Click "Upload Audio File"
   - Select a high-quality audio file
   - Ensure the audio is clear with minimal background noise

5. Review Your Audio:
   - Listen to the recording/upload
   - Use the waveform to select specific portions if needed
   - Adjust noise suppression if necessary

6. Enter Voice Details:
   - Voice Name: Give your cloned voice a name
   - Description: Optional description
   - Language: Select the primary language

7. Click "Clone" to create your voice
   - Processing typically takes 1-2 minutes
   - You'll receive a notification when complete

Best Practices:
• Use a quiet environment with minimal background noise
• Speak clearly and at a normal pace
• Ensure good microphone quality
• Record at least 10-15 seconds for best results
• Use consistent tone and volume throughout

Your cloned voice will be available in the Voices tab and can be assigned to any agent.`
    }
  };

  // Search across all sections
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    Object.keys(sections).forEach((key) => {
      const section = sections[key];
      const titleMatch = section.title.toLowerCase().includes(query);
      const contentMatch = section.content.toLowerCase().includes(query);
      
      if (titleMatch || contentMatch) {
        // Find matching lines in content
        const lines = section.content.split('\n');
        const matchingLines = lines
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => line.toLowerCase().includes(query));
        
        // Calculate relevance score (heading matches get higher priority)
        let score = 0;
        if (titleMatch) score += 100; // High priority for heading match
        if (contentMatch) score += 10;
        score += matchingLines.length; // More matches = higher score
        
        results.push({
          sectionKey: key,
          sectionTitle: section.title,
          score,
          matchingLines: matchingLines.slice(0, 3) // Show first 3 matching lines
        });
      }
    });
    
    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery]);

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return sections[activeSection].content;
    }
    
    const query = searchQuery.toLowerCase();
    const content = sections[activeSection].content;
    const lines = content.split('\n');
    
    // Highlight matching lines
    return lines.map(line => {
      if (line.toLowerCase().includes(query)) {
        return `**${line}**`;
      }
      return line;
    }).join('\n');
  }, [searchQuery, activeSection]);

  return (
    <div className="info-page">
      <div className="info-header">
        {/* Title removed - already shown in TopBar */}
        <p className="info-subtitle">Documentation and guides for using Scalysis</p>
      </div>

      {/* Search Bar */}
      <div className="info-search-container">
        <div className="info-search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', left: '16px', color: '#9CA3AF' }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            className="info-search-input"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && (
        <div style={{
          marginTop: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1F2937' }}>
            Search Results ({searchResults.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveSection(result.sectionKey);
                  setSearchQuery('');
                }}
                style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4B5CFF';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(75, 92, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  {result.sectionTitle}
                </div>
                {result.matchingLines.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    {result.matchingLines.map(({ line }, i) => (
                      <div key={i} style={{ marginTop: i > 0 ? '4px' : 0 }}>
                        {line.trim().substring(0, 80)}{line.trim().length > 80 ? '...' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults && searchResults.length === 0 && (
        <div style={{
          marginTop: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          textAlign: 'center',
          color: '#6B7280'
        }}>
          No results found for "{searchQuery}"
        </div>
      )}

      <div className="info-content-wrapper">
        {/* Sidebar Navigation */}
        <div className="info-sidebar">
          <h3 className="info-sidebar-title">Topics</h3>
          <nav className="info-nav">
            {Object.keys(sections).map((key) => (
              <button
                key={key}
                className={`info-nav-item ${activeSection === key ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(key);
                  setSearchQuery('');
                }}
              >
                {sections[key].title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="info-main-content">
          <h1 className="info-content-title">{sections[activeSection].title}</h1>
          <div className="info-content-body">
            {filteredContent.split('\n').map((line, index) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} style={{ fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                    {line.slice(2, -2)}
                  </p>
                );
              }
              if (line.startsWith('•')) {
                return (
                  <li key={index} style={{ marginBottom: '8px', marginLeft: '20px' }}>
                    {line.substring(1).trim()}
                  </li>
                );
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              return (
                <p key={index} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#374151' }}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
