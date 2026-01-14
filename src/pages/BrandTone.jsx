import React, { useState } from 'react';

const BrandTone = ({ shop }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [talkingStyle, setTalkingStyle] = useState('');
  const [rules, setRules] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))]);
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleProcess = () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one recording');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing (dummy data)
    setTimeout(() => {
      setTalkingStyle('The speaker uses a casual, friendly tone with frequent use of filler words like "toh basically" and "umm". They speak in a conversational manner, often using Hindi-English mix (Hinglish). The pace is moderate with natural pauses.');
      
      setRules([
        'Start sentences with "toh basically..." when explaining concepts',
        'Use "umm" and "uhh" as natural fillers during thinking pauses',
        'Mix Hindi and English naturally (Hinglish)',
        'Use "na" at the end of questions for confirmation',
        'Keep tone friendly and approachable, not formal',
        'Use "yaar" or "bhai" for addressing customers casually',
        'Add "right?" or "haina?" for seeking agreement',
        'Use "like" as a filler word occasionally',
        'Speak in short, digestible sentences',
        'Use "actually" to correct or clarify points'
      ]);
      
      setSystemPrompt(`You are a customer service representative with a casual, friendly speaking style. 

Key characteristics:
- Start explanations with "toh basically..." to introduce concepts
- Use natural fillers like "umm", "uhh" when thinking
- Mix Hindi and English naturally (Hinglish) when appropriate
- Use "na" at the end of questions for confirmation
- Keep your tone friendly and approachable, never formal
- Use casual address terms like "yaar" or "bhai" when appropriate
- Add "right?" or "haina?" to seek agreement
- Use "like" as a filler word occasionally
- Speak in short, digestible sentences
- Use "actually" to correct or clarify points

Maintain this conversational, casual tone throughout all customer interactions.`);
      
      setIsProcessing(false);
      setIsProcessed(true);
    }, 2000);
  };

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: '#1d1d1f', 
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Brand Tone
        </h1>
        <p style={{ 
          fontSize: '17px', 
          color: '#6e6e73', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          Upload recordings to analyze and extract your brand's unique talking style
        </p>
      </div>

      {/* Upload Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e5e5e7',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: '600', 
            color: '#1d1d1f', 
            margin: '0 0 8px 0'
          }}>
            Upload Recordings
          </h2>
          <p style={{ 
            fontSize: '15px', 
            color: '#6e6e73', 
            margin: 0
          }}>
            Upload multiple audio recordings to analyze your brand's speaking style
          </p>
        </div>

        {/* File Upload Area */}
        <div
          style={{
            border: '2px dashed #d2d2d7',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            background: '#fbfbfd',
            transition: 'all 0.2s',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#0071e3';
            e.currentTarget.style.background = '#f0f7ff';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '#d2d2d7';
            e.currentTarget.style.background = '#fbfbfd';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#d2d2d7';
            e.currentTarget.style.background = '#fbfbfd';
            const files = Array.from(e.dataTransfer.files);
            setUploadedFiles(prev => [...prev, ...files.map(file => ({
              id: Date.now() + Math.random(),
              file,
              name: file.name,
              size: file.size,
              type: file.type
            }))]);
          }}
        >
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px' }}>
                Click to upload or drag and drop
              </div>
              <div style={{ fontSize: '13px', color: '#6e6e73' }}>
                Audio files (MP3, WAV, M4A)
              </div>
            </div>
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#1d1d1f', 
              marginBottom: '12px' 
            }}>
              Uploaded Files ({uploadedFiles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#fbfbfd',
                    borderRadius: '10px',
                    border: '1px solid #e5e5e7'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18V5L21 3V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="2"/>
                        <circle cx="18" cy="16" r="3" stroke="white" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '500', 
                        color: '#1d1d1f',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6e6e73' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#f5f5f7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e5e5e7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f5f5f7';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={uploadedFiles.length === 0 || isProcessing}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: uploadedFiles.length === 0 || isProcessing 
              ? '#e5e5e7' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: '600',
            cursor: uploadedFiles.length === 0 || isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: uploadedFiles.length === 0 || isProcessing 
              ? 'none' 
              : '0 4px 12px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (uploadedFiles.length > 0 && !isProcessing) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (uploadedFiles.length > 0 && !isProcessing) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {isProcessing ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              Processing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Process Recordings
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {isProcessed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Talking Style */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e5e7',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: '600', 
                  color: '#1d1d1f', 
                  margin: 0
                }}>
                  Sample Talking Style
                </h2>
              </div>
              <p style={{ 
                fontSize: '15px', 
                color: '#6e6e73', 
                margin: 0,
                marginLeft: '52px'
              }}>
                AI-powered analysis of your brand's unique speaking style
              </p>
            </div>
            <div style={{
              padding: '20px',
              background: '#fbfbfd',
              borderRadius: '12px',
              border: '1px solid #e5e5e7',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#1d1d1f'
            }}>
              {talkingStyle}
            </div>
          </div>

          {/* Rules */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e5e7',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11L12 14L22 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: '600', 
                  color: '#1d1d1f', 
                  margin: 0
                }}>
                  Talking Style Rules
                </h2>
              </div>
              <p style={{ 
                fontSize: '15px', 
                color: '#6e6e73', 
                margin: 0,
                marginLeft: '52px'
              }}>
                Guidelines on how to talk like your brand
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rules.map((rule, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: '#fbfbfd',
                    borderRadius: '12px',
                    border: '1px solid #e5e5e7'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>→</span>
                  </div>
                  <div style={{ 
                    fontSize: '15px', 
                    lineHeight: '1.6', 
                    color: '#1d1d1f',
                    flex: 1
                  }}>
                    {rule}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5e5e7',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: '600', 
                  color: '#1d1d1f', 
                  margin: 0
                }}>
                  Generated System Prompt
                </h2>
              </div>
              <p style={{ 
                fontSize: '15px', 
                color: '#6e6e73', 
                margin: 0,
                marginLeft: '52px'
              }}>
                AI-generated system prompt based on your brand's talking style
              </p>
            </div>
            <div style={{
              padding: '20px',
              background: '#1d1d1f',
              borderRadius: '12px',
              border: '1px solid #2d2d2f',
              fontSize: '14px',
              lineHeight: '1.7',
              color: '#f5f5f7',
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}>
              {systemPrompt}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(systemPrompt);
                alert('System prompt copied to clipboard!');
              }}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#f5f5f7',
                color: '#1d1d1f',
                border: '1px solid #e5e5e7',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e5e7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f7';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
              </svg>
              Copy System Prompt
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BrandTone;

