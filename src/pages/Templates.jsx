import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTutorial } from '../contexts/TutorialContext';
import './Templates.css';

function Templates({ shop }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [playingScript, setPlayingScript] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentStep, isActive: isTutorialActive, nextStep } = useTutorial();

  const templates = [
    { name: 'Call Center', image: 'callcenter.png', inUse: 234, title: 'Professional, Gets Job Done' },
    { name: 'Friendly & Playful', image: 'Friendly&Playful.png', inUse: 189, title: 'Warm, Engaging, Conversational' },
    { name: 'Calm & Soothing', image: 'calmsoothing.png', inUse: 156, title: 'Relaxed, Patient, Understanding' },
    { name: 'Cheap (b2b)', image: 'cheapb2b.png', inUse: 98, title: 'Direct, Efficient, Value-Focused' },
    { name: 'Luxury Sales', image: 'luxurysales.png', inUse: 312, title: 'Elegant, Premium, Sophisticated' }
  ];

  const templateScripts = [
    { 
      id: 'test-scalysis-intro-laughter',
      name: 'Test Scalysis Intro (Laughter)', 
      intro: 'A friendly introduction script with natural laughter for engaging customer conversations',
      gender: 'Female',
      category: 'D2C & Sales',
      avgTime: '1:45',
      inUse: '1.5K',
      verified: true
    },
    { 
      id: 'test-scalysis-no-laughter',
      name: 'Test Scalysis (No laughter)', 
      intro: 'Professional introduction script without laughter for formal business interactions',
      gender: 'Male',
      category: 'D2C',
      avgTime: '1:32',
      inUse: '892',
      verified: false
    },
    { 
      id: 'order-verification',
      name: 'Order Verification Call', 
      intro: 'Verify customer orders and confirm delivery details with a warm, helpful approach',
      gender: 'Female',
      category: 'Sales & Leads',
      avgTime: '1:58',
      inUse: '2.1K',
      verified: true
    },
    { 
      id: 'delivery-followup',
      name: 'Delivery Follow-up', 
      intro: 'Follow up on deliveries, check satisfaction, and address any delivery concerns',
      gender: 'Male',
      category: 'Telemarketing',
      avgTime: '1:28',
      inUse: '756',
      verified: true
    }
  ];

  return (
    <div className="templates-page">
      <div className="templates-content">
        {/* Choose templates according to your use cases */}
        <div className="templates-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => navigate(`/playground${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`)}
              className="templates-back-btn"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="templates-section-title">Choose templates according to your use cases:</h2>
          </div>
          
          <div className="templates-cards-grid">
            {templates.map((template, index) => {
              // Extract base filename without extension for constructing image paths
              const baseImageName = template.image.replace('.png', '');
              
              return (
              <div 
                key={index}
                className={`template-card ${selectedTemplate === index ? 'selected' : ''} ${index === 0 ? 'tutorial-first-template' : ''}`}
                onClick={() => {
                  setSelectedTemplate(index);
                  
                  // Progress tutorial if active and on template step
                  if (isTutorialActive && currentStep === 2) {
                    nextStep();
                  }
                }}
              >
                {/* Up Section - Image with Stacked Cards */}
                <div className="template-card-image-section">
                  <div className="stacked-cards-container">
                    {/* Bottom card (furthest back, most angled) */}
                    <div className="stacked-card stacked-card-4">
                      <img 
                        src={`/images/templates/${encodeURIComponent(baseImageName + '4.png')}`}
                        alt="Card 4"
                        className="stacked-card-image"
                      />
                    </div>
                    {/* Middle card 2 */}
                    <div className="stacked-card stacked-card-3">
                      <img 
                        src={`/images/templates/${encodeURIComponent(baseImageName + '3.png')}`}
                        alt="Card 3"
                        className="stacked-card-image"
                      />
                    </div>
                    {/* Middle card 1 */}
                    <div className="stacked-card stacked-card-2">
                      <img 
                        src={`/images/templates/${encodeURIComponent(baseImageName + '2.png')}`}
                        alt="Card 2"
                        className="stacked-card-image"
                      />
                    </div>
                    {/* Top card (white with image) */}
                    <div className="stacked-card stacked-card-1">
                      <img 
                        src={`/images/templates/${encodeURIComponent(template.image)}`}
                        alt={template.name}
                        className="template-card-image"
                      />
                    </div>
                  </div>
                </div>
                {/* Below Section - Text */}
                <div className="template-card-text-section">
                  <div className="template-card-name">{template.name}</div>
                  <div className="template-card-subtext">{template.inUse} in use</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* All Time Trending */}
        <div className="templates-section">
          <div className="trending-section-header">
            <h2 className="templates-section-title">{templates[selectedTemplate]?.title || 'All Time Trending'}</h2>
            <div className="trending-search-container">
              <div className="trending-search-wrapper">
                <img 
                  src="/images/Raycons Icons Pack (Community)/search-normal-8532441.svg" 
                  alt="Search" 
                  className="trending-search-icon"
                />
                <input
                  type="text"
                  placeholder="Search scripts..."
                  className="trending-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Tabular scripts */}
          <div className="trending-scripts-table">
            <table className="scripts-table">
              <tbody>
                {templateScripts
                  .filter(script => 
                    searchQuery === '' || 
                    script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    script.intro.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    script.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    script.gender.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((script, index) => {
                  const rotation = (index * 45) % 360;
                  const hueRotate = (index * 30) % 360;
                  const isPlaying = playingScript === script.id;
                  
                  return (
                    <tr 
                      key={script.id} 
                      className="script-table-row"
                      onClick={() => {
                        const shopParam = shop ? `?shop=${encodeURIComponent(shop)}&template=${encodeURIComponent(script.id)}` : `?template=${encodeURIComponent(script.id)}`;
                        navigate(`/playground${shopParam}`);
                      }}
                    >
                      <td className="script-name-cell">
                        <div className="script-name-wrapper">
                          <div className="script-image-container">
                            <img 
                              src="/images/blobscript.png" 
                              alt="Script" 
                              className="script-blob-image"
                              style={{ 
                                transform: `rotate(${rotation}deg)`,
                                filter: `hue-rotate(${hueRotate}deg) saturate(${100 + (index % 3) * 20}%) brightness(${90 + (index % 2) * 10}%)`
                              }} 
                            />
                          </div>
                          <div className="script-name-content">
                            <div className="script-name-header">
                              <span className="script-name-text">{script.name}</span>
                              {script.verified && (
                                <img 
                                  src="/images/verified-digital-emblem-with-a-translucent-aesthetic-imparting-trust-and-confirmation-on-the-png.png" 
                                  alt="Verified" 
                                  className="verified-icon"
                                  title="🔥 Hot Used"
                                />
                              )}
                            </div>
                            <div className="script-intro-text">{script.intro}</div>
                          </div>
                        </div>
                      </td>
                      <td className="script-gender-cell">{script.gender}</td>
                      <td className="script-category-cell">{script.category}</td>
                      <td className="script-meta-cell">
                        <div className="script-meta-group">
                          <span className="script-avg-time">{script.avgTime}</span>
                          <span className="script-in-use">{script.inUse}</span>
                          <button
                            className="script-play-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingScript(isPlaying ? null : script.id);
                            }}
                          >
                            <img 
                              src={isPlaying ? "/images/poly.svg" : "/images/Polygon 2.svg"} 
                              alt={isPlaying ? "Pause" : "Play"}
                              style={{ width: '14px', height: '14px' }}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Templates;

