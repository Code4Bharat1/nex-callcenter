import React, { useState, useEffect, useRef } from 'react';

const BuildYourScript = ({ shop }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m here to help you build your call agent script. What would you like to create today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = [...messages, { role: 'user', content: userMessage }].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Claude');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const json = JSON.parse(data);
              if (json.chunk) {
                assistantMessage += json.chunk;
                // Update the last message with accumulated content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage
                  };
                  return newMessages;
                });
              } else if (json.error) {
                throw new Error(json.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          letterSpacing: '-0.02em'
        }}>
          Build Your Script
        </h1>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '400'
        }}>
          Chat with Claude to create and refine your call agent scripts
        </p>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        backgroundColor: '#FAFAFA'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              {message.role === 'assistant' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#4B5CFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>C</span>
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '16px 20px',
                borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                backgroundColor: message.role === 'user' ? '#4B5CFF' : '#FFFFFF',
                color: message.role === 'user' ? '#FFFFFF' : '#111827',
                fontSize: '15px',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: message.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                border: message.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                minHeight: '20px'
              }}>
                {message.content || (isLoading && index === messages.length - 1 ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: '#6B7280', 
                      animation: 'pulse 1.4s ease-in-out infinite' 
                    }}></span>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: '#6B7280', 
                      animation: 'pulse 1.4s ease-in-out infinite 0.2s' 
                    }}></span>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: '#6B7280', 
                      animation: 'pulse 1.4s ease-in-out infinite 0.4s' 
                    }}></span>
                  </div>
                ) : null)}
              </div>
              {message.role === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '600' }}>U</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '12px 16px',
              minHeight: '52px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  color: '#111827',
                  resize: 'none',
                  fontFamily: 'inherit',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  minHeight: '28px'
                }}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: inputMessage.trim() && !isLoading ? '#4B5CFF' : '#E5E7EB',
                color: inputMessage.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                minWidth: '80px',
                height: '52px'
              }}
              onMouseEnter={(e) => {
                if (inputMessage.trim() && !isLoading) {
                  e.target.style.backgroundColor = '#3B4CE8';
                }
              }}
              onMouseLeave={(e) => {
                if (inputMessage.trim() && !isLoading) {
                  e.target.style.backgroundColor = '#4B5CFF';
                }
              }}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: '#9CA3AF',
            textAlign: 'center'
          }}>
            Powered by Claude 4.5 Sonnet
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default BuildYourScript;

