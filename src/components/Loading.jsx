import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './Loading.css';

const Loading = ({ size = 'medium', text, inline = false, rectangular = false }) => {
  const sizeMap = {
    small: '40px',
    medium: '60px',
    large: '80px',
    inline: '20px'
  };

  const baseSize = sizeMap[inline ? 'inline' : size] || sizeMap.medium;
  
  // For rectangular mode, make it wider and crop height
  let width, height, containerClass;
  
  if (rectangular) {
    // Make it much bigger - 10x wider and crop height to show only horizontal animation
    // For large size (80px), this makes it 800px wide and 80px tall
    width = `calc(${baseSize} * 10)`;
    height = baseSize;
    containerClass = 'loading-container loading-rectangular';
  } else if (inline) {
    width = baseSize;
    height = baseSize;
    containerClass = 'loading-inline';
  } else {
    width = baseSize;
    height = baseSize;
    containerClass = 'loading-container';
  }

  if (inline) {
    return (
      <div className="loading-inline">
        <DotLottieReact
          src="https://lottie.host/2eec8fc9-aed6-46ec-a68d-f8ff7915bcd3/adgcagzCZJ.lottie"
          loop
          autoplay
          style={{ width, height: width }}
        />
        {text && <span>{text}</span>}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="loading-lottie-wrapper" style={{ width, height }}>
        <DotLottieReact
          src="https://lottie.host/2eec8fc9-aed6-46ec-a68d-f8ff7915bcd3/adgcagzCZJ.lottie"
          loop
          autoplay
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default Loading;

