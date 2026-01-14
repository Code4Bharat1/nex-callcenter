import React, { useState, useEffect, useRef } from 'react';
import './HelpSupportWidget.css';

const HelpSupportWidget = ({ isEmbedded = false, onClose }) => {
  const [showWidget, setShowWidget] = useState(isEmbedded);
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'messages'
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'operator',
      header: { name: 'Operator', from: 'from Scalysis' },
      texts: ['Hi there 👋', 'What brings you to Scalysis today?']
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: message.trim()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate operator response after a delay
    setIsTyping(true);
    setTimeout(() => {
      const operatorResponse = {
        type: 'operator',
        header: { name: 'Operator', from: 'from Scalysis' },
        texts: ['Thanks for reaching out! How can I help you today?']
      };
      setChatMessages(prev => [...prev, operatorResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestedQuestions = [
    {
      icon: '📚',
      text: 'How do I create a new agent?',
      answer: 'To create a new agent, go to the Playground tab and click "Create New Agent". Fill in the agent details including name, script content, and voice settings.'
    },
    {
      icon: '⚙️',
      text: 'How do I configure voice settings?',
      answer: 'Navigate to the Voice tab in Playground. You can select from available voices, adjust speed, pitch, and other voice parameters to customize your agent\'s speech.'
    },
    {
      icon: '📊',
      text: 'How do I view call analytics?',
      answer: 'Visit the Analytics tab to see detailed call statistics, performance metrics, conversion rates, and other insights about your agent\'s performance.'
    },
    {
      icon: '🔧',
      text: 'How do I test my agent?',
      answer: 'Use the floating test call button in the bottom right corner. You can create a test order or use an existing one to make a test call and verify your agent\'s behavior.'
    }
  ];

  useEffect(() => {
    if (showWidget && activeTab === 'messages' && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [showWidget, activeTab]);

  const handleClose = () => {
    setShowWidget(false);
    if (isEmbedded && onClose) {
      onClose();
    }
  };

  return (
    <>
      {showWidget && (
        <div className="help-support-window-v2">
          <div className="help-support-window">
            <div className="rectangle-135"></div>
            <div className="frame-360">
              <div className="frame-357">
                <img src="/images/1200.png" alt="" className="frame-357-vector" />
                <div className="group-157">
                  <img src="/images/Ellipse 4.svg" alt="" className="group-157-icon" />
                  <img src="/images/Ellipse 5.svg" alt="" className="group-157-icon" />
                  <img src="/images/Ellipse 6.svg" alt="" className="group-157-icon" />
                </div>
              </div>
              <div className="frame-161">
                <p className="frame-161-text frame-161-text-hello">Hello There</p>
                <p className="frame-161-text">How can we help?</p>
              </div>
            </div>
            <div className="frame-362">
              {activeTab === 'home' ? (
                <>
                  <div className="frame-358">
                    <div className="frame-358-content">
                      <p className="frame-358-title">Send us a message</p>
                      <p className="frame-358-subtitle">We typically reply within a day</p>
                    </div>
                    <svg className="frame-358-arrow" xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M2.25 13.603L11.606 8.20096C12.606 7.62396 12.606 6.18096 11.606 5.60296L2.25 0.200962C2.0219 0.0692686 1.76315 -4.21667e-05 1.49976 1.92458e-08C1.23637 4.22052e-05 0.977641 0.0694359 0.749584 0.201202C0.521526 0.332969 0.332185 0.522462 0.200601 0.750625C0.0690178 0.978788 -0.000168623 1.23758 3.08616e-07 1.50096V12.304C-0.000168623 12.5673 0.0690178 12.8261 0.200601 13.0543C0.332185 13.2825 0.521526 13.472 0.749584 13.6037C0.977641 13.7355 1.23637 13.8049 1.49976 13.8049C1.76315 13.805 2.0219 13.7357 2.25 13.604V13.603ZM4.197 7.38496L3.08616e-07 8.50996V5.29496L4.197 6.41796C4.691 6.55096 4.691 7.25196 4.197 7.38396V7.38496Z" fill="#334BFA"/>
                    </svg>
                  </div>
                  <div className="frame-361">
                    <div className="frame-363">
                      <p className="frame-363-text">Search for help</p>
                      <svg className="frame-361-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M7.5 12.125C10.0543 12.125 12.125 10.0543 12.125 7.5C12.125 4.94568 10.0543 2.875 7.5 2.875C4.94568 2.875 2.875 4.94568 2.875 7.5C2.875 10.0543 4.94568 12.125 7.5 12.125Z" stroke="#0057FF" strokeWidth="1.75"/>
                        <path d="M13.3813 14.6187C13.723 14.9604 14.277 14.9604 14.6187 14.6187C14.9604 14.277 14.9604 13.723 14.6187 13.3813L13.3813 14.6187ZM10.3813 11.6187L13.3813 14.6187L14.6187 13.3813L11.6187 10.3813L10.3813 11.6187Z" fill="#0057FF"/>
                      </svg>
                    </div>
                    <div className="frame-368">
                      <div className="frame-364">
                        <p className="frame-364-text">A/B test different message variations</p>
                        <svg className="frame-364-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="frame-365">
                        <p className="frame-364-text">Reuse bot content by linking Custom Bots</p>
                        <svg className="frame-364-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="frame-366">
                        <p className="frame-364-text">Custom Bots explained</p>
                        <svg className="frame-364-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="frame-367">
                        <p className="frame-364-text">Install and configure the Salesforce app</p>
                        <svg className="frame-364-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="frame-362-chat">
                  <div className="frame-362-chat-messages">
                    {chatMessages.map((msg, index) => (
                      msg.type === 'operator' ? (
                        <div key={index} className="frame-362-operator-message">
                          <div className="frame-159-operator">
                            <img src="/images/Ellipse 7.svg" alt="Operator" className="frame-159-ellipse" />
                            <div className="frame-356-operator">
                              <div className="frame-159-operator-header">
                                <p className="frame-159-operator-name">{msg.header.name}</p>
                                <p className="frame-159-operator-from">{msg.header.from}</p>
                              </div>
                              {msg.texts.map((text, textIndex) => (
                                <p key={textIndex} className="frame-159-operator-text">{text}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={index} className="frame-362-user-message">
                          <div className="frame-353-user">
                            <p className="frame-353-user-text">{msg.text}</p>
                          </div>
                        </div>
                      )
                    ))}
                    {isTyping && (
                      <div className="frame-362-operator-message">
                        <div className="frame-159-operator">
                          <img src="/images/Ellipse 7.svg" alt="Operator" className="frame-159-ellipse" />
                          <div className="frame-356-operator">
                            <p className="frame-159-operator-text">Typing...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Chat Input */}
                  <form className="frame-362-chat-input" onSubmit={handleSendMessage}>
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      className="frame-362-input-field"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      ref={inputRef}
                    />
                    <button type="submit" className="frame-362-send-button">
                      <svg className="frame-362-send-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.25 13.603L11.606 8.20096C12.606 7.62396 12.606 6.18096 11.606 5.60296L2.25 0.200962C2.0219 0.0692686 1.76315 -4.21667e-05 1.49976 1.92458e-08C1.23637 4.22052e-05 0.977641 0.0694359 0.749584 0.201202C0.521526 0.332969 0.332185 0.522462 0.200601 0.750625C0.0690178 0.978788 -0.000168623 1.23758 3.08616e-07 1.50096V12.304C-0.000168623 12.5673 0.0690178 12.8261 0.200601 13.0543C0.332185 13.2825 0.521526 13.472 0.749584 13.6037C0.977641 13.7355 1.23637 13.8049 1.49976 13.8049C1.76315 13.805 2.0219 13.7357 2.25 13.604V13.603ZM4.197 7.38496L3.08616e-07 8.50996V5.29496L4.197 6.41796C4.691 6.55096 4.691 7.25196 4.197 7.38396V7.38496Z" fill="#334BFA"/>
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
            <div className="frame-369">
              <div className={`frame-370 ${activeTab === 'home' ? 'frame-nav-active' : ''}`} onClick={() => setActiveTab('home')}>
                <div className="frame-nav-icon-container">
                  <svg className="frame-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10.5 2.335L3 7.51C2.375 7.947 2 8.626 2 9.35V19.7C2 20.965 3.125 22 4.5 22H19.5C20.875 22 22 20.965 22 19.7V9.35C22 8.626 21.625 7.947 21 7.51L13.5 2.335C13.0565 2.03707 12.5343 1.87796 12 1.87796C11.4657 1.87796 10.9435 2.03707 10.5 2.335ZM7.316 14.366C7.23309 14.2895 7.1358 14.2304 7.02979 14.1919C6.92378 14.1534 6.81117 14.1364 6.69853 14.1419C6.58588 14.1473 6.47545 14.1752 6.37367 14.2238C6.27189 14.2723 6.1808 14.3407 6.10569 14.4248C6.03058 14.5089 5.97297 14.6072 5.9362 14.7138C5.89944 14.8204 5.88426 14.9333 5.89155 15.0458C5.89884 15.1583 5.92845 15.2683 5.97866 15.3693C6.02887 15.4703 6.09867 15.5603 6.184 15.634C7.78299 17.065 9.85421 17.8549 12 17.852C14.233 17.852 16.272 17.012 17.816 15.634C17.9013 15.5603 17.9711 15.4703 18.0213 15.3693C18.0716 15.2683 18.1012 15.1583 18.1085 15.0458C18.1157 14.9333 18.1006 14.8204 18.0638 14.7138C18.027 14.6072 17.9694 14.5089 17.8943 14.4248C17.8192 14.3407 17.7281 14.2723 17.6263 14.2238C17.5245 14.1752 17.4141 14.1473 17.3015 14.1419C17.1888 14.1364 17.0762 14.1534 16.9702 14.1919C16.8642 14.2304 16.7669 14.2895 16.684 14.366C15.3964 15.5187 13.7282 16.1548 12 16.152C10.2 16.152 8.56 15.477 7.316 14.366Z" fill={activeTab === 'home' ? '#0057FF' : '#1A1A1A'}/>
                  </svg>
                </div>
                <p className={`frame-nav-text ${activeTab === 'home' ? '' : 'frame-nav-text-unselected'}`}>Home</p>
              </div>
              <div className={`frame-371 ${activeTab === 'messages' ? 'frame-nav-active' : ''}`} onClick={() => setActiveTab('messages')}>
                <div className="frame-nav-icon-container">
                  <svg className="frame-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <mask id="mask0_312_70" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="21">
                      <path fillRule="evenodd" clipRule="evenodd" d="M19 2C19.7956 2 20.5587 2.31607 21.1213 2.87868C21.6839 3.44129 22 4.20435 22 5V20.806C22 22.141 20.387 22.811 19.441 21.868L15.56 18H5C4.20435 18 3.44129 17.6839 2.87868 17.1213C2.31607 16.5587 2 15.7956 2 15V5C2 4.20435 2.31607 3.44129 2.87868 2.87868C3.44129 2.31607 4.20435 2 5 2H19Z" fill={activeTab === 'messages' ? '#0057FF' : '#1A1A1A'}/>
                    </mask>
                    <g mask="url(#mask0_312_70)">
                      <path d="M19.441 21.868L20.641 20.664L19.441 21.868ZM15.56 18V16.3H16.262L16.76 16.796L15.56 18ZM20.3 5C20.3 4.65522 20.163 4.32456 19.9192 4.08076C19.6754 3.83697 19.3448 3.7 19 3.7V0.300003C20.2465 0.300003 21.442 0.79518 22.3234 1.6766C23.2048 2.55802 23.7 3.75349 23.7 5H20.3ZM20.3 13.956V5H23.7V13.956H20.3ZM20.3 16.5V13.956H23.7V16.5H20.3ZM20.3 20.806V16.5H23.7V20.806H20.3ZM20.641 20.664C20.6112 20.639 20.5756 20.622 20.5375 20.6144C20.4994 20.6069 20.46 20.6092 20.423 20.621C20.3884 20.6388 20.359 20.6651 20.3374 20.6975C20.3159 20.7299 20.303 20.7672 20.3 20.806H23.7C23.7 23.654 20.259 25.083 18.241 23.073L20.641 20.664ZM16.759 16.796L20.641 20.664L18.241 23.073L14.359 19.204L16.759 16.796ZM4.99999 16.3H15.559V19.7H4.99999V16.3ZM3.69999 15C3.69999 15.3448 3.83695 15.6754 4.08075 15.9192C4.32455 16.163 4.65521 16.3 4.99999 16.3V19.7C3.75347 19.7 2.55801 19.2048 1.67659 18.3234C0.795165 17.442 0.299988 16.2465 0.299988 15H3.69999ZM3.69999 5V15H0.299988V5H3.69999ZM4.99999 3.7C4.65521 3.7 4.32455 3.83697 4.08075 4.08076C3.83695 4.32456 3.69999 4.65522 3.69999 5H0.299988C0.299988 3.75349 0.795165 2.55802 1.67659 1.6766C2.55801 0.79518 3.75347 0.300003 4.99999 0.300003V3.7ZM19 3.7H4.99999V0.300003H19V3.7Z" fill={activeTab === 'messages' ? '#0057FF' : '#1A1A1A'}/>
                    </g>
                    <path fillRule="evenodd" clipRule="evenodd" d="M17 7C17.2255 7 17.4417 7.08955 17.6011 7.24896C17.7605 7.40836 17.85 7.62457 17.85 7.85C17.85 8.07543 17.7605 8.29164 17.6011 8.45104C17.4417 8.61045 17.2255 8.7 17 8.7H7.00002C6.8884 8.7 6.77787 8.67801 6.67474 8.6353C6.57162 8.59258 6.47791 8.52997 6.39898 8.45104C6.32005 8.37211 6.25744 8.27841 6.21473 8.17528C6.17201 8.07215 6.15002 7.96162 6.15002 7.85C6.15002 7.73838 6.17201 7.62785 6.21473 7.52472C6.25744 7.42159 6.32005 7.32789 6.39898 7.24896C6.47791 7.17003 6.57162 7.10742 6.67474 7.0647C6.77787 7.02199 6.8884 7 7.00002 7H17ZM12 11C12.2255 11 12.4417 11.0896 12.6011 11.249C12.7605 11.4084 12.85 11.6246 12.85 11.85C12.85 12.0754 12.7605 12.2916 12.6011 12.451C12.4417 12.6104 12.2255 12.7 12 12.7H7.00002C6.77459 12.7 6.55839 12.6104 6.39898 12.451C6.23958 12.2916 6.15002 12.0754 6.15002 11.85C6.15002 11.6246 6.23958 11.4084 6.39898 11.249C6.55839 11.0896 6.77459 11 7.00002 11H12Z" fill={activeTab === 'messages' ? '#0057FF' : '#1A1A1A'}/>
                  </svg>
                </div>
                <p className={`frame-nav-text ${activeTab === 'messages' ? '' : 'frame-nav-text-unselected'}`}>Messages</p>
              </div>
              <div className="frame-372">
                <div className="frame-nav-icon-container">
                  <svg className="frame-nav-icon-small" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21.65C17.3295 21.65 21.65 17.3296 21.65 12C21.65 6.67046 17.3295 2.35001 12 2.35001C6.67043 2.35001 2.34998 6.67046 2.34998 12C2.34998 17.3296 6.67043 21.65 12 21.65Z" stroke="#1A1A1A" strokeWidth="1.7"/>
                    <path d="M9.66394 8.576C9.78583 8.24605 9.97847 7.94678 10.2283 7.6992C10.4782 7.45162 10.7792 7.26174 11.1103 7.14288C11.4413 7.02403 11.7944 6.97908 12.1447 7.0112C12.495 7.04331 12.834 7.15172 13.1379 7.3288C13.4418 7.50587 13.7033 7.74733 13.9039 8.03622C14.1046 8.32511 14.2396 8.65443 14.2995 9.00104C14.3593 9.34766 14.3426 9.70318 14.2504 10.0426C14.1582 10.3821 13.9929 10.6973 13.7659 10.966L12.6909 12.07C12.3649 12.392 11.9259 12.83 11.9259 13.614V13.978" stroke="#1A1A1A" strokeWidth="1.7" strokeLinecap="round"/>
                    <path d="M11.927 17.768C12.4152 17.768 12.811 17.3722 12.811 16.884C12.811 16.3958 12.4152 16 11.927 16C11.4387 16 11.043 16.3958 11.043 16.884C11.043 17.3722 11.4387 17.768 11.927 17.768Z" fill="#1A1A1A"/>
                  </svg>
                </div>
                <p className="frame-nav-text frame-nav-text-unselected">Help</p>
              </div>
              <div className="frame-373">
                <div className="frame-nav-icon-container">
                  <svg className="frame-nav-icon-small" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clipPath="url(#clip0_311_84)">
                      <path d="M20 4C20.6661 4.65104 21.1952 5.42884 21.5561 6.28756C21.9169 7.14628 22.1022 8.06855 22.101 9C22.101 10.959 21.297 12.73 20 14" stroke="#1A1A1A" strokeWidth="1.7" strokeLinecap="round"/>
                      <mask id="mask0_311_84" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="-1" y="0" width="18" height="23">
                        <path fillRule="evenodd" clipRule="evenodd" d="M9.50003 14H10.218L15.449 17.452C15.5998 17.5516 15.7747 17.6084 15.9552 17.6165C16.1357 17.6246 16.315 17.5836 16.4741 17.498C16.6331 17.4124 16.766 17.2852 16.8587 17.1301C16.9513 16.975 17.0001 16.7977 17 16.617V1.85801C17 1.6775 16.9511 1.50036 16.8586 1.3454C16.766 1.19043 16.6332 1.0634 16.4743 0.97779C16.3154 0.892181 16.1363 0.851182 15.9559 0.859143C15.7756 0.867103 15.6008 0.923726 15.45 1.02301L10.937 4.00001H5.00003C3.84347 3.99912 2.72236 4.39922 1.82767 5.13215C0.932988 5.86508 0.320057 6.8855 0.0932811 8.01962C-0.133495 9.15374 0.0399104 10.3314 0.583961 11.352C1.12801 12.3726 2.00906 13.1731 3.07703 13.617L5.04403 20.829C5.18865 21.359 5.52069 21.8184 5.97849 22.122C6.43629 22.4257 6.98873 22.5528 7.5332 22.4799C8.07767 22.4069 8.57716 22.1388 8.93889 21.7254C9.30063 21.312 9.50002 20.7813 9.50003 20.232V14Z" fill="#1A1A1A"/>
                      </mask>
                      <g mask="url(#mask0_311_84)">
                        <path d="M10.218 14L11.154 12.581L10.728 12.301H10.218V14ZM9.50005 14V12.3H7.80005V14H9.50005ZM15.45 17.452L14.513 18.872L15.449 17.452H15.45ZM15.45 1.023L14.513 -0.395996L15.449 1.024L15.45 1.023ZM10.937 4V5.7H11.447L11.873 5.42L10.938 4H10.937ZM3.07705 13.617L4.71705 13.17L4.49705 12.368L3.73105 12.048L3.07605 13.618L3.07705 13.617ZM5.04305 20.829L6.68305 20.382L5.04305 20.829ZM10.217 12.3H9.50005V15.7H10.218V12.3H10.217ZM16.385 16.033L11.153 12.581L9.28005 15.42L14.512 18.872L16.385 16.034V16.033ZM15.299 16.617C15.2992 16.4907 15.3334 16.3668 15.3983 16.2584C15.4631 16.1499 15.5561 16.0611 15.6673 16.0012C15.7785 15.9414 15.9039 15.9127 16.03 15.9183C16.1562 15.9239 16.2786 15.9635 16.3841 16.033L14.512 18.871C16.307 20.056 18.699 18.768 18.699 16.618H15.299V16.617ZM15.299 1.858V16.618H18.699V1.857H15.299V1.858ZM16.3841 2.442C16.2786 2.51148 16.1562 2.55111 16.03 2.5567C15.9039 2.5623 15.7785 2.53364 15.6673 2.47377C15.5561 2.41391 15.4631 2.32506 15.3983 2.21665C15.3334 2.10825 15.2992 1.98432 15.299 1.858H18.699C18.699 -0.291996 16.307 -1.58 14.512 -0.395996L16.385 2.442H16.3841ZM11.874 5.419L16.3841 2.442L14.512 -0.395996L10.001 2.581L11.873 5.419H11.874ZM5.00005 5.7H10.938V2.3H5.00005V5.7ZM1.70005 9C1.70005 8.12479 2.04773 7.28542 2.6666 6.66655C3.28547 6.04768 4.12483 5.7 5.00005 5.7V2.3C1.30005 2.3 -1.69995 5.3 -1.69995 9H1.70005ZM3.73205 12.048C3.13022 11.7974 2.61608 11.3742 2.25445 10.8317C1.89283 10.2893 1.69992 9.65193 1.70005 9H-1.69995C-1.7001 10.3229 -1.30865 11.6163 -0.574936 12.7172C0.158778 13.818 1.20193 14.677 2.42305 15.186L3.73205 12.048ZM6.68405 20.382L4.71805 13.17L1.43805 14.065L3.40405 21.276L6.68405 20.382ZM7.23205 20.8C7.10752 20.8 6.98642 20.7591 6.8874 20.6836C6.78839 20.6081 6.71694 20.5021 6.68405 20.382L3.40405 21.276C3.63307 22.1158 4.13187 22.8569 4.8236 23.3853C5.51533 23.9137 6.36161 24.2 7.23205 24.2V20.8ZM7.80005 20.232C7.80005 20.3826 7.74021 20.5271 7.63369 20.6336C7.52716 20.7402 7.38269 20.8 7.23205 20.8V24.2C8.28443 24.2 9.2937 23.7819 10.0378 23.0378C10.782 22.2937 11.2 21.2844 11.2 20.232H7.80005ZM7.80005 14V20.232H11.2V14H7.80005Z" fill="#1A1A1A"/>
                      </g>
                    </g>
                    <defs>
                      <clipPath id="clip0_311_84">
                        <rect width="24" height="24" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <p className="frame-nav-text frame-nav-text-unselected">News</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isEmbedded && (
        <button
          className="help-support-widget-btn"
          onClick={() => setShowWidget(!showWidget)}
          title="Help & Support"
          aria-label="Open Help & Support"
        >
          {showWidget ? (
            <img src="/images/arrow 1.svg" alt="Close Help & Support" width="16" height="10" />
          ) : (
            <img src="/images/Group.svg" alt="Help & Support" />
          )}
        </button>
      )}
    </>
  );
};

export default HelpSupportWidget;

