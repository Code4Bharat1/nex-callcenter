import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './CloneVoice.css';

const CloneVoice = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const [activeTab, setActiveTab] = useState('record');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedEnd, setSelectedEnd] = useState(0);
  const [useEntireClip, setUseEntireClip] = useState(true);
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [audioFile, setAudioFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [noiseSuppressionLevel, setNoiseSuppressionLevel] = useState(0);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  
  // Language list with codes
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  ];
  
  const selectedLanguage = languages.find(lang => lang.code === voiceLanguage) || languages[0];

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const canvasRef = useRef(null);
  const [waveformData, setWaveformData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const selectionContainerRef = useRef(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Language toggle state
  const [useHindi, setUseHindi] = useState(false);
  
  // Sample texts for reading prompt
  const sampleTextEnglish = "I'm recording audio to clone my voice on Scalysis. Afterwards, I'll be able to produce speech that sounds just like me. I can't wait to hear what I sound like.";
  const sampleTextHindi = "Main Scalysis par apni voice clone karne ke liye audio record kar raha hoon. Iske baad, main apni tarah ki speech produce kar paunga. Mujhe sunne mein mazaa aayega ki main kaise sound karta hoon.";
  
  const sampleText = useHindi ? sampleTextHindi : sampleTextEnglish;

  const copySampleText = () => {
    navigator.clipboard.writeText(sampleText);
    setStatus('Text copied to clipboard');
    setTimeout(() => setStatus(''), 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          if (audioChunks.length === 0) {
            console.error('No audio chunks recorded');
            setStatus('Recording failed: No audio data');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          if (!blob || blob.size === 0) {
            console.error('Invalid blob created');
            setStatus('Recording failed: Invalid audio data');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioUrl(url);
          setAudioFile(new File([blob], 'recording.webm', { type: 'audio/webm' }));
          setStatus('Recording saved');
          setShowNotification(true);
          stream.getTracks().forEach(track => track.stop());
          
          // Set audio duration and generate waveform with error handling
          try {
            const audio = new Audio(url);
            
            audio.addEventListener('error', (error) => {
              console.error('Audio loading error:', error);
              setStatus('Recording saved but failed to load. Please try recording again.');
            });

            audio.addEventListener('loadedmetadata', () => {
              try {
                if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                  setAudioDuration(audio.duration);
                  if (useEntireClip) {
                    setSelectedEnd(audio.duration);
                    setSelectedStart(0);
                  }
                  // Generate waveform with error handling
                  generateWaveform(blob).catch(error => {
                    console.error('Waveform generation error:', error);
                    setStatus('Recording saved but waveform generation failed. You can still proceed.');
                  });
                } else {
                  throw new Error('Invalid audio duration');
                }
              } catch (error) {
                console.error('Error processing recording metadata:', error);
                setStatus('Recording saved but failed to process. Please try recording again.');
              }
            });

            audio.load();
          } catch (error) {
            console.error('Error creating audio element:', error);
            setStatus('Recording saved but failed to process. Please try recording again.');
          }
        } catch (error) {
          console.error('Error in recorder.onstop:', error);
          setStatus('Recording failed. Please try again.');
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setRecording(true);
      setMediaRecorder(recorder);
      setStatus('Recording...');
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) {
        return;
      }

      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('File size is too large. Please select a file smaller than 50MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setStatus('File selected: ' + file.name);
      
      // Set audio duration and generate waveform with error handling
      try {
        const audio = new Audio(url);
        
        // Handle audio loading errors
        audio.addEventListener('error', (error) => {
          console.error('Audio loading error:', error);
          alert('Failed to load audio file. Please try a different file format.');
          setAudioFile(null);
          setAudioUrl(null);
          setAudioBlob(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });

        audio.addEventListener('loadedmetadata', () => {
          try {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
              setAudioDuration(audio.duration);
              if (useEntireClip) {
                setSelectedEnd(audio.duration);
                setSelectedStart(0);
              }
              // Generate waveform with error handling
              generateWaveform(file).catch(error => {
                console.error('Waveform generation error:', error);
                setStatus('File loaded but waveform generation failed. You can still proceed.');
              });
            } else {
              throw new Error('Invalid audio duration');
            }
          } catch (error) {
            console.error('Error processing audio metadata:', error);
            alert('Failed to process audio file. Please try a different file.');
            setAudioFile(null);
            setAudioUrl(null);
            setAudioBlob(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        });

        // Load the audio
        audio.load();
      } catch (error) {
        console.error('Error creating audio element:', error);
        alert('Failed to process audio file. Please try a different file format.');
        setAudioFile(null);
        setAudioUrl(null);
        setAudioBlob(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Also create a blob from the file for consistency with error handling
      try {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        setAudioBlob(blob);
      } catch (error) {
        console.error('Error creating blob:', error);
        // Try to create blob from file directly as fallback
        try {
          const blob = new Blob([file], { type: file.type });
          setAudioBlob(blob);
        } catch (fallbackError) {
          console.error('Fallback blob creation failed:', fallbackError);
          setStatus('File selected but blob creation failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleFileChange:', error);
      alert('An error occurred while processing the file. Please try again.');
      setAudioFile(null);
      setAudioUrl(null);
      setAudioBlob(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCloneVoice = async () => {
    if (!voiceName.trim()) {
      alert('Please enter a voice name');
      return;
    }

    if (!audioFile && !audioBlob) {
      alert('Please select an audio file or record audio');
      return;
    }

    try {
      setIsCloning(true);
      setStatus('Cloning voice...');
      
      const formData = new FormData();
      
      // Use selected portion or entire clip
      let finalAudioBlob = audioBlob || audioFile;
      if (!useEntireClip && (audioBlob || audioFile) && selectedEnd > selectedStart) {
        // Implement audio trimming logic
        try {
          finalAudioBlob = await trimAudio(audioBlob || audioFile, selectedStart, selectedEnd);
        } catch (error) {
          console.error('Error trimming audio:', error);
          alert('Failed to trim audio. Using entire clip instead.');
          finalAudioBlob = audioBlob || audioFile;
        }
      }
      
      // Use voiceLanguage from dropdown (not useHindi toggle)
      formData.append('clip', finalAudioBlob);
      formData.append('name', voiceName.trim());
      formData.append('description', voiceDescription.trim() || '');
      formData.append('language', voiceLanguage);

      const response = await api.cloneVoice(shop, formData);
      
      if (response.success) {
        alert('Voice created successfully!');
        
        // Dispatch event to refresh cloned voices in Voices page
        window.dispatchEvent(new CustomEvent('voiceCloned', { 
          detail: { voice: response.voice } 
        }));
        
        // Reset form
        setVoiceName('');
        setVoiceDescription('');
        setUseHindi(false);
        setAudioFile(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setStatus('');
        setSelectedStart(0);
        setSelectedEnd(0);
        setUseEntireClip(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(response.error || 'Failed to create voice');
        setStatus('');
      }
    } catch (error) {
      console.error('Create voice error:', error);
      alert('Error creating voice: ' + error.message);
      setStatus('');
    } finally {
      setIsCloning(false);
    }
  };

  // Trim audio to selected portion
  const trimAudio = async (audioBlob, startTime, endTime) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioData = await audioContext.decodeAudioData(arrayBuffer);
      
      const sampleRate = audioData.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = endSample - startSample;
      
      // Create new audio buffer with trimmed data
      const trimmedBuffer = audioContext.createBuffer(
        audioData.numberOfChannels,
        length,
        sampleRate
      );
      
      for (let channel = 0; channel < audioData.numberOfChannels; channel++) {
        const channelData = audioData.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          trimmedData[i] = channelData[startSample + i];
        }
      }
      
      // Convert back to blob
      const wav = audioBufferToWav(trimmedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      return blob;
    } catch (error) {
      console.error('Error trimming audio:', error);
      throw error;
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  // Generate waveform from audio file
  const generateWaveform = async (audioBlob) => {
    try {
      if (!audioBlob) {
        console.error('No audio blob provided');
        return;
      }

      let arrayBuffer;
      try {
        arrayBuffer = await audioBlob.arrayBuffer();
      } catch (error) {
        console.error('Error reading array buffer:', error);
        throw new Error('Failed to read audio file');
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Audio file is empty');
      }

      let audioContext;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error('Error creating audio context:', error);
        throw new Error('Audio context not supported');
      }

      let audioData;
      try {
        audioData = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      } catch (error) {
        console.error('Error decoding audio data:', error);
        throw new Error('Failed to decode audio. Please try a different file format.');
      }

      if (!audioData || !audioData.getChannelData || audioData.numberOfChannels === 0) {
        throw new Error('Invalid audio data');
      }

      const rawData = audioData.getChannelData(0);
      if (!rawData || rawData.length === 0) {
        throw new Error('No audio data found');
      }

      const samples = 200; // Number of bars
      const blockSize = Math.max(1, Math.floor(rawData.length / samples));
      const filteredData = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        const startIndex = i * blockSize;
        const endIndex = Math.min(startIndex + blockSize, rawData.length);
        
        for (let j = startIndex; j < endIndex; j++) {
          if (rawData[j] !== undefined && !isNaN(rawData[j])) {
            sum += Math.abs(rawData[j]);
          }
        }
        
        if (endIndex > startIndex) {
          filteredData.push(sum / (endIndex - startIndex));
        } else {
          filteredData.push(0);
        }
      }
      
      if (filteredData.length === 0) {
        throw new Error('No waveform data generated');
      }

      const max = Math.max(...filteredData);
      if (max === 0 || !isFinite(max)) {
        // If all values are zero, set a default waveform
        setWaveformData(new Array(samples).fill(0.1));
        return;
      }

      const normalizedData = filteredData.map(n => {
        const normalized = n / max;
        return isFinite(normalized) && normalized >= 0 ? normalized : 0;
      });
      
      setWaveformData(normalizedData);
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Set empty waveform data instead of crashing
      setWaveformData([]);
      throw error; // Re-throw to let caller handle if needed
    }
  };

  // Handle play/pause
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (useEntireClip) {
          audioRef.current.currentTime = 0;
        } else {
          audioRef.current.currentTime = selectedStart;
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update playback position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updatePosition = () => {
      setPlaybackPosition(audio.currentTime);
      if (!useEntireClip && audio.currentTime >= selectedEnd) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = selectedStart;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (useEntireClip) {
        setPlaybackPosition(0);
        audio.currentTime = 0;
      } else {
        setPlaybackPosition(selectedStart);
        audio.currentTime = selectedStart;
      }
    };

    audio.addEventListener('timeupdate', updatePosition);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updatePosition);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, isPlaying, useEntireClip, selectedStart, selectedEnd]);

  // Handle selection dragging
  const handleMouseDown = (type) => {
    if (type === 'start') setIsDraggingStart(true);
    if (type === 'end') setIsDraggingEnd(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!selectionContainerRef.current || (!isDraggingStart && !isDraggingEnd)) return;
      
      const rect = selectionContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const time = (percentage / 100) * audioDuration;

      if (isDraggingStart) {
        const newStart = Math.min(time, selectedEnd - 0.1);
        setSelectedStart(newStart);
        setUseEntireClip(false);
      }
      if (isDraggingEnd) {
        const newEnd = Math.max(time, selectedStart + 0.1);
        setSelectedEnd(newEnd);
        setUseEntireClip(false);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, audioDuration, selectedStart, selectedEnd]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);


  return (
    <div className="clone-voice-page">
      {/* Top Header */}
      <div className="clone-voice-top-header">
        <h1 className="clone-voice-title">Instantly Mirror anyone's Voice</h1>
      </div>

      {/* Cards Container - Side by Side */}
      <div className="clone-voice-cards-container">
        {/* Section 1: Input Card */}
        <div className="clone-voice-card input-card">
        <div className="section-header">
          <div className="section-number">1</div>
          <h2 className="section-title">Audio</h2>
        </div>

        {/* Tabs */}
        <div className="clone-tabs">
          <button
            className={`clone-tab-btn ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            <img src="/images/record.svg" alt="" width="20" height="20" />
            <span>Record</span>
          </button>
          <button
            className={`clone-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <img src="/images/upload.svg" alt="" width="20" height="20" />
            <span>Upload</span>
          </button>
        </div>

        {activeTab === 'record' && (
          <div className="record-section">
            <h3 className="record-heading">Record a voice clip</h3>
            
            {/* Audio Waveform */}
            {(recording || audioUrl) && (
              <div className="audio-waveform-section">
                <p className="waveform-label">Select 3-10 seconds of audio to use</p>
                <div className="waveform-container" ref={waveformRef}>
                  {audioUrl ? (
                    <>
                      <div 
                        className="waveform-visualization" 
                        ref={selectionContainerRef}
                      >
                        <div className="waveform-bars">
                          {waveformData.length > 0 && audioDuration > 0 ? waveformData.map((amplitude, i) => {
                            try {
                              const barPosition = (i / waveformData.length) * 100;
                              const startPercent = audioDuration > 0 ? (selectedStart / audioDuration) * 100 : 0;
                              const endPercent = audioDuration > 0 ? (selectedEnd / audioDuration) * 100 : 0;
                              const isInSelection = useEntireClip || 
                                (barPosition >= startPercent && barPosition <= endPercent);
                              const playbackPercent = audioDuration > 0 ? (playbackPosition / audioDuration) * 100 : 0;
                              const isAtPlayback = Math.abs(barPosition - playbackPercent) < 0.5;
                              
                              const safeAmplitude = isFinite(amplitude) && amplitude >= 0 ? amplitude : 0;
                              const barHeight = Math.max(5, Math.min(90, safeAmplitude * 80 + 10));
                              const barWidth = waveformData.length > 0 ? 100 / waveformData.length : 0;
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`waveform-bar ${isInSelection ? 'selected' : ''} ${isAtPlayback ? 'playing' : ''}`}
                                  style={{ 
                                    height: `${barHeight}%`,
                                    width: `${barWidth}%`
                                  }}
                                />
                              );
                            } catch (error) {
                              console.error('Error rendering waveform bar:', error);
                              return null;
                            }
                          }) : (
                            <div className="waveform-loading">Loading waveform...</div>
                          )}
                        </div>
                        {!useEntireClip && audioDuration > 0 && (
                          <>
                            <div 
                              className="selection-overlay"
                              style={{
                                left: `${Math.max(0, Math.min(100, (selectedStart / audioDuration) * 100))}%`,
                                width: `${Math.max(0, Math.min(100, ((selectedEnd - selectedStart) / audioDuration) * 100))}%`
                              }}
                            />
                            <div 
                              className="selection-handle selection-handle-start"
                              style={{ left: `${Math.max(0, Math.min(100, (selectedStart / audioDuration) * 100))}%` }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleMouseDown('start');
                              }}
                            />
                            <div 
                              className="selection-handle selection-handle-end"
                              style={{ left: `${Math.max(0, Math.min(100, (selectedEnd / audioDuration) * 100))}%` }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleMouseDown('end');
                              }}
                            />
                          </>
                        )}
                        {isPlaying && audioDuration > 0 && (
                          <div 
                            className="playback-indicator"
                            style={{ left: `${Math.max(0, Math.min(100, (playbackPosition / audioDuration) * 100))}%` }}
                          />
                        )}
                      </div>
                      <div className="audio-info">
                        <span className="audio-length">Length: {audioDuration.toFixed(2)}s</span>
                        <label className="use-entire-clip">
                          <input
                            type="checkbox"
                            checked={useEntireClip}
                            onChange={(e) => {
                              setUseEntireClip(e.target.checked);
                              if (e.target.checked) {
                                setSelectedStart(0);
                                setSelectedEnd(audioDuration);
                              }
                            }}
                          />
                          <span>Use entire clip</span>
                        </label>
                      </div>
                      <div className="audio-player-controls">
                        <button className="play-button" onClick={togglePlayback}>
                          {isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                              <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                            </svg>
                          )}
                        </button>
                        <div className="audio-time">
                          <span>{Math.floor(playbackPosition / 60)}:{String(Math.floor(playbackPosition % 60)).padStart(2, '0')}</span>
                          <span>/</span>
                          <span>{Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</span>
                        </div>
                        <div className="audio-progress-bar">
                          <div 
                            className="audio-progress-fill"
                            style={{ width: `${audioDuration > 0 ? Math.max(0, Math.min(100, (playbackPosition / audioDuration) * 100)) : 0}%` }}
                          />
                        </div>
                      </div>
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        style={{ display: 'none' }}
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setPlaybackPosition(audioRef.current.currentTime);
                          }
                        }}
                      />
                    </>
                  ) : (
                    <div className="recording-indicator">
                      <div className="recording-dot"></div>
                      <span>Recording...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Record Button */}
            <button
              className={`record-button ${recording ? 'recording' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              type="button"
            >
              <img src="/images/record.svg" alt="" width="24" height="24" />
              <span>{recording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>

            {/* Best Results Tips */}
            <div className="best-results-tips">
              <p className="tips-title">Best Results:</p>
              <div className="tips-tags">
                <div className="tip-tag">
                  <img src="/images/speech.svg" alt="" width="20" height="20" />
                  <span>5-10s of speech</span>
                </div>
                <div className="tip-tag">
                  <img src="/images/gaps.svg" alt="" width="20" height="20" />
                  <span>No gaps or silence</span>
                </div>
                <div className="tip-tag">
                  <img src="/images/pace.svg" alt="" width="20" height="20" />
                  <span>Matching pace</span>
                </div>
              </div>
            </div>

            {/* Reading Prompt */}
            <div className="reading-prompt">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p className="prompt-label" style={{ margin: 0 }}>Need something to read:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>English</span>
                  <button
                    type="button"
                    onClick={() => setUseHindi(!useHindi)}
                    style={{
                      position: 'relative',
                      width: '36px',
                      height: '18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: useHindi ? '#4B5CFF' : '#D1D5DB',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      padding: '2px',
                      outline: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        transition: 'transform 0.2s ease',
                        transform: useHindi ? 'translateX(18px)' : 'translateX(0)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </button>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Hindi (Hinglish)</span>
                </div>
              </div>
              <div className="sample-text-box">
                <div className="sample-text-content">{sampleText}</div>
                <button className="copy-icon-btn" onClick={copySampleText}>
                  <img src="/images/copy.svg" alt="Copy" width="20" height="20" />
                </button>
              </div>
            </div>

            {/* Noise Suppression Level */}
            <div className="noise-suppression-section">
              <label className="slider-label">
                <span>Noise Suppression Level:</span>
                <span className="slider-value">{noiseSuppressionLevel}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={noiseSuppressionLevel}
                onChange={(e) => setNoiseSuppressionLevel(parseInt(e.target.value))}
                className="noise-slider"
                style={{ '--slider-value': `${noiseSuppressionLevel}%` }}
              />
              <p className="slider-description">
                Adjust the level of noise suppression applied to the audio clip. The higher the level, the more noise is suppressed.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-section">
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                id="audioFile"
                className="file-input"
                accept="audio/*"
                onChange={handleFileChange}
              />
              <label htmlFor="audioFile" className="file-upload-label">
                <img src="/images/upload.svg" alt="" width="24" height="24" />
                <span>Choose File</span>
              </label>
              {audioFile && (
                <span className="file-name">{audioFile.name}</span>
              )}
            </div>
            
            {/* Audio Waveform - same as recording tab */}
            {audioUrl && (
              <div className="audio-waveform-section">
                <p className="waveform-label">Select 3-10 seconds of audio to use</p>
                <div className="waveform-container" ref={waveformRef}>
                  <div 
                    className="waveform-visualization" 
                    ref={selectionContainerRef}
                  >
                    <div className="waveform-bars">
                      {waveformData.length > 0 && audioDuration > 0 ? waveformData.map((amplitude, i) => {
                        try {
                          const barPosition = (i / waveformData.length) * 100;
                          const startPercent = audioDuration > 0 ? (selectedStart / audioDuration) * 100 : 0;
                          const endPercent = audioDuration > 0 ? (selectedEnd / audioDuration) * 100 : 0;
                          const isInSelection = useEntireClip || 
                            (barPosition >= startPercent && barPosition <= endPercent);
                          const playbackPercent = audioDuration > 0 ? (playbackPosition / audioDuration) * 100 : 0;
                          const isAtPlayback = Math.abs(barPosition - playbackPercent) < 0.5;
                          
                          const safeAmplitude = isFinite(amplitude) && amplitude >= 0 ? amplitude : 0;
                          const barHeight = Math.max(5, Math.min(90, safeAmplitude * 80 + 10));
                          const barWidth = waveformData.length > 0 ? 100 / waveformData.length : 0;
                          
                          return (
                            <div 
                              key={i} 
                              className={`waveform-bar ${isInSelection ? 'selected' : ''} ${isAtPlayback ? 'playing' : ''}`}
                              style={{ 
                                height: `${barHeight}%`,
                                width: `${barWidth}%`
                              }}
                            />
                          );
                        } catch (error) {
                          console.error('Error rendering waveform bar:', error);
                          return null;
                        }
                      }) : (
                        <div className="waveform-loading">Loading waveform...</div>
                      )}
                    </div>
                    {!useEntireClip && audioDuration > 0 && (
                      <>
                        <div 
                          className="selection-overlay"
                          style={{
                            left: `${Math.max(0, Math.min(100, (selectedStart / audioDuration) * 100))}%`,
                            width: `${Math.max(0, Math.min(100, ((selectedEnd - selectedStart) / audioDuration) * 100))}%`
                          }}
                        />
                        <div 
                          className="selection-handle selection-handle-start"
                          style={{ left: `${Math.max(0, Math.min(100, (selectedStart / audioDuration) * 100))}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown('start');
                          }}
                        />
                        <div 
                          className="selection-handle selection-handle-end"
                          style={{ left: `${Math.max(0, Math.min(100, (selectedEnd / audioDuration) * 100))}%` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown('end');
                          }}
                        />
                      </>
                    )}
                    {isPlaying && audioDuration > 0 && (
                      <div 
                        className="playback-indicator"
                        style={{ left: `${Math.max(0, Math.min(100, (playbackPosition / audioDuration) * 100))}%` }}
                      />
                    )}
                  </div>
                  <div className="audio-info">
                    <span className="audio-length">Length: {audioDuration.toFixed(2)}s</span>
                    <label className="use-entire-clip">
                      <input
                        type="checkbox"
                        checked={useEntireClip}
                        onChange={(e) => {
                          setUseEntireClip(e.target.checked);
                          if (e.target.checked) {
                            setSelectedStart(0);
                            setSelectedEnd(audioDuration);
                          }
                        }}
                      />
                      <span>Use entire clip</span>
                    </label>
                  </div>
                  <div className="audio-player-controls">
                    <button className="play-button" onClick={togglePlayback}>
                      {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                          <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                        </svg>
                      )}
                    </button>
                    <div className="audio-time">
                      <span>{Math.floor(playbackPosition / 60)}:{String(Math.floor(playbackPosition % 60)).padStart(2, '0')}</span>
                      <span>/</span>
                      <span>{Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</span>
                    </div>
                    <div className="audio-progress-bar">
                      <div 
                        className="audio-progress-fill"
                        style={{ width: `${audioDuration > 0 ? Math.max(0, Math.min(100, (playbackPosition / audioDuration) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    style={{ display: 'none' }}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setPlaybackPosition(audioRef.current.currentTime);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Section 2: Details Card */}
        <div className="clone-voice-card details-card">
          <div className="section-header">
            <div className="section-number">2</div>
            <h2 className="section-title">Details</h2>
          </div>

          <div className="details-form">
            <div className="form-group">
              <label htmlFor="voiceName">Name*</label>
              <input
                type="text"
                id="voiceName"
                className="form-input"
                placeholder="Enter voice name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="voiceDescription">Description</label>
              <input
                type="text"
                id="voiceDescription"
                className="form-input"
                placeholder="Enter description (optional)"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="voiceLanguage">Language*</label>
              <div className="language-dropdown-wrapper">
                <div className={`language-dropdown ${languageDropdownOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="language-dropdown-button"
                    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  >
                    <span className="language-flag">{selectedLanguage.flag}</span>
                    <span className="language-name">{selectedLanguage.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9L12 15L18 9" />
                    </svg>
                  </button>
                  {languageDropdownOpen && (
                    <div className="language-dropdown-menu">
                      <div className="language-list">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            className="language-option"
                            onClick={() => {
                              setVoiceLanguage(lang.code);
                              setLanguageDropdownOpen(false);
                            }}
                          >
                            <span className="language-flag">{lang.flag}</span>
                            <span className="language-name">{lang.name}</span>
                            {voiceLanguage === lang.code && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clone Button */}
            <div className="clone-button-wrapper">
              <button
                className="clone-button"
                onClick={handleCloneVoice}
                disabled={isCloning || (!audioBlob && !audioFile) || !voiceName}
                type="button"
              >
                <img src="/images/clone.svg" alt="" width="16" height="16" />
                <span>{isCloning ? 'Cloning...' : 'Clone Voice'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="clone-voice-instructions-static">
        <div className="instructions-section instructions-do">
          <div className="instructions-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3 className="instructions-section-title">Best Practices</h3>
          </div>
          <ol className="instructions-list">
            <li>
              <strong>Upload voice in MP3 format</strong> with <strong>0 background noise</strong>
            </li>
            <li>
              Use a <strong>quiet environment</strong> with minimal echo and ambient sounds
            </li>
            <li>
              Record <strong>3-10 seconds</strong> of clear, natural speech
            </li>
            <li>
              Speak at a <strong>normal pace</strong> and volume - avoid shouting or whispering
            </li>
            <li>
              Use a <strong>good quality microphone</strong> for best results
            </li>
            <li>
              Ensure the audio file is <strong>uncompressed or high-quality</strong> (minimum 16kHz sample rate)
            </li>
          </ol>
        </div>

        <div className="instructions-section instructions-avoid">
          <div className="instructions-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="instructions-section-title">Things to Avoid</h3>
          </div>
          <ol className="instructions-list">
            <li>
              <strong>Don't play audio from phone speaker and then record</strong> - This disrupts quality from speaker. Instead, use the upload file directly.
            </li>
            <li>
              While testing audio on call, <strong>listen with ear or earphones</strong> - Listening on speaker or real phone call speaker would disrupt the quality.
            </li>
            <li>
              Avoid <strong>background music, TV, or other voices</strong> in the recording
            </li>
            <li>
              Don't use <strong>heavily compressed audio files</strong> or low bitrate recordings
            </li>
            <li>
              Avoid <strong>echo, reverb, or room noise</strong> in the recording environment
            </li>
          </ol>
        </div>
      </div>

      {/* Floating Notification */}
      {showNotification && status && (
        <div className={`clone-voice-notification ${showNotification ? 'show' : 'hide'}`}>
          <div className="clone-voice-notification-content">
            <span className="clone-voice-notification-text">{status}</span>
            <button 
              className="clone-voice-notification-close"
              onClick={() => {
                setShowNotification(false);
                setTimeout(() => setStatus(''), 300);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloneVoice;
