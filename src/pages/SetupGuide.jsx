import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './SetupGuide.css';

const SetupGuide = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');

  return (
    <div className="setup-guide-page">
      <div className="setup-guide-container">
        <h1>Setup Guide</h1>
        <p>Welcome to Scalysis! This page will guide you through setting up your Shopify store integration.</p>
        {shop && (
          <p className="shop-info">Shop: {shop}</p>
        )}
        {/* Content will be added later */}
      </div>
    </div>
  );
};

export default SetupGuide;

