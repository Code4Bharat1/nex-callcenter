import React, { useState, useEffect, useRef } from 'react';

/**
 * Glass Blur Overlay for Write with AI
 * Shows when AI is generating script content
 * Displays animated cursor, typing effect, and blurred background text
 */
const GlassBlurOverlay = ({ isActive = true, message = "AI is crafting your script...", aiGeneratedText = '' }) => {
  // ========== BLUR CONTROLS - TWEAK THESE ==========
  const MAIN_BACKDROP_BLUR = 20;        // px (0-50)
  const TEXT_BLUR = 3;                  // px (0-10)
  const TEXT_OPACITY = 0.15;           // 0-1 (0.15-0.35 recommended)
  const OVERLAY_OPACITY = 0.7;          // 0-1 (0.5-1.0)
  // =================================================

  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 60, y: 80 });
  const [animatedText, setAnimatedText] = useState('');
  const textContainerRef = useRef(null);
  const measureRef = useRef(null);

  // Cursor blink effect
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [isActive]);

  // Typing animation using the actual AI-generated text or placeholder
  useEffect(() => {
    if (!isActive) return;

    const placeholderText = `Generating script content...
This may take a few moments...

The AI is analyzing your requirements and crafting a personalized script based on your instructions.

Please wait while we create your custom call script...`;

    const textToType = placeholderText;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= textToType.length) {
        setAnimatedText(textToType.slice(0, currentIndex));

        requestAnimationFrame(() => {
          if (measureRef.current) {
            const tempSpan = document.createElement('span');
            tempSpan.textContent = textToType.slice(0, currentIndex);
            tempSpan.style.cssText = `
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 13px;
              line-height: 1.6;
              white-space: pre-wrap;
              word-break: break-word;
              letter-spacing: 0.5px;
              position: absolute;
              visibility: hidden;
              top: 0;
              left: 0;
            `;
            measureRef.current.appendChild(tempSpan);

            const range = document.createRange();
            range.selectNodeContents(tempSpan);
            range.collapse(false);
            const rect = range.getBoundingClientRect();
            const containerRect = measureRef.current.getBoundingClientRect();

            setCursorPosition({
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top
            });

            measureRef.current.removeChild(tempSpan);
          }
        });

        currentIndex++;
      } else {
        currentIndex = 0;
      }
    }, 45);

    return () => clearInterval(typingInterval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: `
            radial-gradient(circle at 30% 20%, rgba(75, 92, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            linear-gradient(135deg,
              rgba(255, 255, 255, ${OVERLAY_OPACITY}) 0%,
              rgba(249, 250, 251, ${OVERLAY_OPACITY}) 50%,
              rgba(255, 255, 255, ${OVERLAY_OPACITY}) 100%
            )
          `,
          backdropFilter: `blur(${MAIN_BACKDROP_BLUR}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${MAIN_BACKDROP_BLUR}px) saturate(180%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-out',
          pointerEvents: 'none'
        }}
      >
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(75, 92, 255, 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          bottom: '15%',
          right: '20%',
          filter: 'blur(50px)',
          animation: 'float 10s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        <div
          ref={measureRef}
          style={{
            position: 'absolute',
            inset: '60px',
            overflow: 'hidden',
            pointerEvents: 'none',
            visibility: 'hidden'
          }}
        />

        <div
          ref={textContainerRef}
          style={{
            position: 'absolute',
            inset: '60px',
            opacity: TEXT_OPACITY,
            overflow: 'hidden',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#111827',
            filter: `blur(${TEXT_BLUR}px)`,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
          }}
        >
          <div style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transform: 'scale(1.02)',
            letterSpacing: '0.5px'
          }}>
            {animatedText}
          </div>
        </div>

        <div style={{
          position: 'absolute',
          left: `calc(60px + ${cursorPosition.x}px)`,
          top: `calc(60px + ${cursorPosition.y}px)`,
          width: '2px',
          height: '18px',
          background: 'linear-gradient(180deg, #4B5CFF 0%, #6F7BFF 100%)',
          borderRadius: '1px',
          opacity: cursorVisible ? 1 : 0,
          boxShadow: `
            0 0 30px rgba(75, 92, 255, 0.8),
            0 0 60px rgba(75, 92, 255, 0.5),
            0 0 90px rgba(75, 92, 255, 0.3),
            0 0 120px rgba(75, 92, 255, 0.15)
          `,
          transition: 'left 0.15s ease-out, top 0.15s ease-out, opacity 0.05s',
          animation: 'cursorPulse 1.5s ease-in-out infinite',
          zIndex: 5
        }} />

        <div style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          padding: '32px 48px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4B5CFF 0%, #6F7BFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(75, 92, 255, 0.3)',
            animation: 'iconBounce 2s ease-in-out infinite'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.02em',
              marginBottom: '8px'
            }}>
              {message}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6B7280',
              fontWeight: 500
            }}>
              Analyzing your requirements and generating content...
            </div>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '280px',
            height: '6px',
            background: 'rgba(209, 213, 219, 0.3)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              height: '100%',
              background: 'linear-gradient(90deg, #4B5CFF 0%, #6F7BFF 50%, #4B5CFF 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '3px',
              animation: 'progressBar 2s ease-in-out infinite',
              boxShadow: '0 0 10px rgba(75, 92, 255, 0.5)'
            }} />
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '4px'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4B5CFF 0%, #6F7BFF 100%)',
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  boxShadow: '0 2px 8px rgba(75, 92, 255, 0.3)'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cursorPulse {
          0%, 100% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.7; transform: scaleY(0.9); }
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-12px); opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes progressBar {
          0% { width: 0%; background-position: 0% 50%; }
          50% { width: 70%; background-position: 100% 50%; }
          100% { width: 100%; background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
};

export default GlassBlurOverlay;
