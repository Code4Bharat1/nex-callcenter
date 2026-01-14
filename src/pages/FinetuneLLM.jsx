import React, { useState, useEffect } from 'react';
import './FinetuneLLM.css';

const FinetuneLLM = () => {
  const [activeTab, setActiveTab] = useState('training'); // 'training' or 'models'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showExtractionOptions, setShowExtractionOptions] = useState(false);
  const [selectedExtractionTypes, setSelectedExtractionTypes] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [waveformData, setWaveformData] = useState({}); // Store waveform data per file
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = React.useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName, fileType) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext) || fileType?.startsWith('audio/')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      );
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || fileType?.startsWith('image/')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    }
    if (ext === 'pdf' || fileType === 'application/pdf') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    }
    // Default paperclip icon
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    );
  };

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(f => {
      const fileId = Date.now() + Math.random();
      // Generate waveform data for audio files and store it
      const isAudio = f.type?.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(f.name.split('.').pop()?.toLowerCase());
      if (isAudio) {
        const waveform = Array.from({ length: 20 }).map(() => Math.random() * 20 + 8);
        setWaveformData(prev => ({ ...prev, [fileId]: waveform }));
      }
      return {
        id: fileId,
        name: f.name,
        size: f.size,
        type: f.type,
        file: f
      };
    });
    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (uploadedFiles.length === 0 && newFiles.length > 0) {
      setShowExtractionOptions(true);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleExtractionToggle = (type) => {
    setSelectedExtractionTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (newFiles.length === 0) {
        setShowExtractionOptions(false);
      }
      return newFiles;
    });
    // Remove waveform data for this file
    setWaveformData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Add to uploaded files
        const fileObj = {
          id: Date.now(),
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
          file: audioFile
        };
        setUploadedFiles(prev => [...prev, fileObj]);
        setShowExtractionOptions(true);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [fineTunedModels, setFineTunedModels] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fineTunedModels');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Error loading finetuned models:', error);
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever models change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fineTunedModels', JSON.stringify(fineTunedModels));
        // Dispatch custom event so Playground can listen for changes
        window.dispatchEvent(new Event('fineTunedModelsUpdated'));
      } catch (error) {
        console.error('Error saving finetuned models:', error);
      }
    }
  }, [fineTunedModels]);

  return (
    <div className="finetune-container">
      {/* Header Tabs */}
      <div className="finetune-header">
        <div className="finetune-tabs">
          <button
            className={`finetune-tab ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => setActiveTab('training')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Train New Model
          </button>
          <button
            className={`finetune-tab ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            My Models
          </button>
        </div>
      </div>

      {/* Training Tab Content */}
      {activeTab === 'training' && (
        <div className="finetune-content">
          {/* Training Documents Card */}
          <div className="finetune-card">
            <div className="card-header">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Training Documents</h2>
                <p className="card-subtitle">Upload documents to train your model</p>
              </div>
            </div>

            <div className="card-content">
              {/* File Upload Area - Direct, no document type selection */}
              <div className="form-group">
                <div
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed #4B5CFF' : '2px dashed #d1d5db',
                    backgroundColor: isDragging ? '#f0f4ff' : '#fafbfc',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    accept="*/*"
                  />
                  <label htmlFor="file-upload" className="upload-label" style={{ cursor: 'pointer' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#6b7280', marginBottom: '12px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                      Drop and drop or browse files
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Maximum 500 MB file size
                    </div>
                  </label>
                </div>

                {/* Voice Recording Button */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: isRecording ? '#EF4444' : '#4B5CFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {isRecording ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        <span>Stop Recording ({formatRecordingTime(recordingTime)})</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                        <span>Record My Thoughts</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Uploaded Files List - Attachment Cards */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                    Attachments:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadedFiles.map((file) => {
                      const isAudio = file.type?.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(file.name.split('.').pop()?.toLowerCase());
                      const isImage = file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.name.split('.').pop()?.toLowerCase());
                      const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
                      const isWeb = file.name.toLowerCase().endsWith('.com') || file.name.toLowerCase().endsWith('.net') || file.name.toLowerCase().endsWith('.org');
                      
                      return (
                        <div
                          key={file.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: '#6b7280',
                              flexShrink: 0
                            }}>
                              {getFileIcon(file.name, file.type)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '14px', 
                                fontWeight: '500', 
                                color: '#111827',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {file.name}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            {isWeb ? (
                              <>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>Web</span>
                                <button
                                  type="button"
                                  onClick={() => window.open(file.name.startsWith('http') ? file.name : `https://${file.name}`, '_blank')}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#6b7280'
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </button>
                              </>
                            ) : isAudio ? (
                              <>
                                <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>0:12</span>
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '2px', 
                                  alignItems: 'center',
                                  marginRight: '8px'
                                }}>
                                  {(waveformData[file.id] || Array.from({ length: 20 }).map(() => Math.random() * 20 + 8)).map((height, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: '3px',
                                        height: `${height}px`,
                                        backgroundColor: '#9ca3af',
                                        borderRadius: '2px'
                                      }}
                                    />
                                  ))}
                                </div>
                                <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>0:48</span>
                                <button
                                  type="button"
                                  onClick={() => alert('Play audio')}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#6b7280'
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                {formatFileSize(file.size)}
                              </span>
                            )}
                            {!isAudio && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = URL.createObjectURL(file.file);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#6b7280'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#6b7280'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extraction Options Card */}
          {showExtractionOptions && (
            <div className="finetune-card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title">What to Extract & Learn?</h2>
                  <p className="card-subtitle">Select the aspects you want the model to learn from your training data</p>
                </div>
              </div>

              <div className="card-content">
                <div className="extraction-options-horizontal">
                  <label className={`extraction-option-small ${selectedExtractionTypes.includes('flow') ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedExtractionTypes.includes('flow')}
                      onChange={() => handleExtractionToggle('flow')}
                    />
                    <div className="extraction-content-small">
                      <div className="extraction-icon-small">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="18" r="3" />
                          <circle cx="6" cy="6" r="3" />
                          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                        </svg>
                      </div>
                      <div className="extraction-details-small">
                        <div className="extraction-title-small">Flow of Conversation (Tree)</div>
                        <div className="extraction-description-small">Learn conversation structure, branching logic, and decision trees</div>
                      </div>
                    </div>
                  </label>

                  <label className={`extraction-option-small ${selectedExtractionTypes.includes('personality') ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedExtractionTypes.includes('personality')}
                      onChange={() => handleExtractionToggle('personality')}
                    />
                    <div className="extraction-content-small">
                      <div className="extraction-icon-small">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="extraction-details-small">
                        <div className="extraction-title-small">Talking Style, Personality & Tone</div>
                        <div className="extraction-description-small">Learn communication style, personality traits, and tone of voice</div>
                      </div>
                    </div>
                  </label>

                  <label className={`extraction-option-small ${selectedExtractionTypes.includes('objections') ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedExtractionTypes.includes('objections')}
                      onChange={() => handleExtractionToggle('objections')}
                    />
                    <div className="extraction-content-small">
                      <div className="extraction-icon-small">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <path d="M9 10h.01M15 10h.01" />
                          <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
                        </svg>
                      </div>
                      <div className="extraction-details-small">
                        <div className="extraction-title-small">Objection Handling (Reply Quality)</div>
                        <div className="extraction-description-small">Learn how to handle objections, concerns, and improve response quality</div>
                      </div>
                    </div>
                  </label>
                </div>

                <button 
                  className="btn-primary" 
                  disabled={selectedExtractionTypes.length === 0}
                  onClick={() => {
                    // Create a new finetuned model (dummy for now)
                    const newModel = {
                      id: Date.now(),
                      name: `FineTuned Model ${fineTunedModels.length + 1}`,
                      description: `Trained on ${uploadedFiles.length} file(s)`,
                      accuracy: '92%',
                      trainedOn: `${uploadedFiles.length} file(s)`,
                      lastUpdated: 'Just now',
                      features: selectedExtractionTypes.map(type => {
                        if (type === 'flow') return 'Flow of Conversation';
                        if (type === 'personality') return 'Talking Style & Tone';
                        if (type === 'objections') return 'Objection Handling';
                        return type;
                      })
                    };
                    setFineTunedModels(prev => [...prev, newModel]);
                    // Reset form
                    setUploadedFiles([]);
                    setSelectedExtractionTypes([]);
                    setShowExtractionOptions(false);
                    alert('Model training started! (This is a demo - backend integration needed)');
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Start Training
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Models Tab Content */}
      {activeTab === 'models' && (
        <div className="finetune-content">
          <div className="models-grid">
            {fineTunedModels.map((model) => (
              <div key={model.id} className="model-card">
                <div className="model-header">
                  <div className="model-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="model-info">
                    <h3 className="model-name">{model.name}</h3>
                    <p className="model-description">{model.description}</p>
                  </div>
                </div>

                <div className="model-stats">
                  <div className="model-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span>Accuracy: {model.accuracy}</span>
                  </div>
                  <div className="model-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{model.trainedOn}</span>
                  </div>
                  <div className="model-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Updated {model.lastUpdated}</span>
                  </div>
                </div>

                <div className="model-features">
                  <div className="features-label">Learned Features:</div>
                  <div className="features-tags">
                    {model.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>

                <div className="model-actions">
                  <button className="btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Details
                  </button>
                  <button className="btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                    Upgrade
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {fineTunedModels.length === 0 && (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <h3>No Fine-tuned Models Yet</h3>
                <p>Train your first model to get started</p>
                <button className="btn-primary" onClick={() => setActiveTab('training')}>
                  Create Your First Model
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinetuneLLM;

