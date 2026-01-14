import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialManager from './components/TutorialManager';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TutorialProvider>
        <TutorialManager>
          <App />
        </TutorialManager>
      </TutorialProvider>
    </BrowserRouter>
  </React.StrictMode>
);
