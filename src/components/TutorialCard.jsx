import React from 'react';
import './TutorialCard.css';

const TutorialCard = ({ 
  title = "Welcome to Scalysis",
  description = "Let's take a quick tour to help you get started with managing your voice campaigns.",
  step = 1,
  totalSteps = 5,
  onNext,
  onSkip,
  onPrev,
  isOpen = true,
  isLastStep = false
}) => {
  
  if (!isOpen) return null;

  return (
    <>
      <div className="tutorial-backdrop"></div>
      
      <div className="tutorial-card">
        <div className="tutorial-content">
          <h2 className="tutorial-title">
            {title}
          </h2>

          <p className="tutorial-description">
            {description}
          </p>

          {/* Skip button - only on non-last steps */}
          {!isLastStep && (
            <button
              onClick={onSkip}
              className="tutorial-skip-btn"
            >
              Skip
            </button>
          )}

          {/* Finish button - only on last step */}
          {isLastStep && (
            <div className="tutorial-buttons">
              <button
                onClick={onNext}
                className="tutorial-btn tutorial-btn-primary"
              >
                Finish
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TutorialCard;
