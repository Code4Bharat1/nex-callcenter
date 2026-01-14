import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import './Layout.css';

// Lazy load child components to prevent module-level initialization errors
const Navbar = lazy(() => import('./Navbar'));
const TopBar = lazy(() => import('./TopBar'));
const UnifiedFloatingWidget = lazy(() => import('./UnifiedFloatingWidget'));
const FloatingTestCallButton = lazy(() => import('./FloatingTestCallButton'));
const HelpSupportWidget = lazy(() => import('./HelpSupportWidget'));
const CallSettingsPage = lazy(() => import('../pages/CallSettings'));

const Layout = ({ children, shop }) => {
  const location = useLocation();
  const [activePage, setActivePage] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  useEffect(() => {
    // Determine active page and title from current route
    const path = location.pathname;
    if (path.includes('onboarding')) {
      setActivePage('onboarding');
      setPageTitle('Onboarding');
    } else if (path.includes('dashboard2.0') || (path.includes('dashboard') && !path.includes('2'))) {
      setActivePage('dashboard');
      setPageTitle('Dashboard');
    } else if (path.includes('all-orders')) {
      setActivePage('all-orders');
      setPageTitle('Shopify Orders');
    } else if (path.includes('csv')) {
      setActivePage('csv');
      setPageTitle('CSV Upload');
    } else if (path.includes('campaigns')) {
      setActivePage('campaigns');
      setPageTitle('Campaigns');
    } else if (path.includes('abandoned-checkouts')) {
      setActivePage('abandoned-checkouts');
      setPageTitle('Abandoned Orders');
    } else if (path.includes('/ndr')) {
      setActivePage('ndr');
      setPageTitle('NDR Orders');
    } else if (path.includes('rto-analysis')) {
      setActivePage('rto-analysis');
      setPageTitle('RTO Insights');
    } else if (path.includes('playground')) {
      setActivePage('playground');
      setPageTitle('Call Scripts');
    } else if (path.includes('finetune-llm')) {
      setActivePage('finetune-llm');
      setPageTitle('Training Documents');
    } else if (path.includes('scripts')) {
      setActivePage('scripts');
      setPageTitle('Scripts');
    } else if (path.includes('call-history')) {
      setActivePage('call-history');
      setPageTitle('Call History');
    } else if (path.includes('stats')) {
      setActivePage('stats');
      setPageTitle('Call Analytics');
    } else if (path.includes('usage')) {
      setActivePage('usage');
      setPageTitle('Billing');
    } else if (path.includes('billing')) {
      setActivePage('billing');
      setPageTitle('Billing');
    } else if (path.includes('pricing')) {
      setActivePage('plan');
      setPageTitle('Plan');
    } else if (path.includes('info')) {
      setActivePage('info');
      setPageTitle('Info');
    } else if (path.includes('voices')) {
      setActivePage('voices');
      setPageTitle('Voice Library');
    } else if (path.includes('clone-voice')) {
      setActivePage('clone-voice');
      setPageTitle('Voice Cloning');
    } else if (path.includes('phone-numbers')) {
      setActivePage('phone-numbers');
      setPageTitle('Phone Numbers');
    } else if (path.includes('integrations')) {
      setActivePage('integrations');
      setPageTitle('Integrations');
    } else if (path.includes('setup-guide')) {
      setActivePage('setup-guide');
      setPageTitle('Setup Guide');
    } else if (path.includes('tour-setup')) {
      setActivePage('tour-setup');
      setPageTitle('Scalysis Setup Guide');
    } else if (path.includes('run-simulation')) {
      setActivePage('run-simulation');
      setPageTitle('Run Simulation');
    } else if (path.includes('test-call')) {
      setActivePage('test-call');
      setPageTitle('Test Script');
    } else if (path.includes('settings')) {
      setActivePage('settings');
      setPageTitle('Settings');
    } else if (path.includes('performance')) {
      setActivePage('performance');
    } else if (path.includes('call-settings')) {
      setActivePage('call-settings');
      setPageTitle('Auto Call Settings');
      setPageTitle('Performance');
    } else if (path.includes('ai-calls')) {
      setActivePage('ai-calls');
      setPageTitle('AI Calls');
    }

    // Handle sidebar collapse on resize
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  // Don't show floating button on CSV page (it's EJS, not React)
  const showFloatingButton = !location.pathname.includes('csv');

  return (
    <div className="app-layout">
      <Suspense fallback={<div style={{ height: '100vh' }} />}>
        <Navbar activePage={activePage} shop={shop} isCollapsed={isCollapsed} />
      </Suspense>
      <main className="main-content">
        <Suspense fallback={<div style={{ height: '60px' }} />}>
          <TopBar pageTitle={pageTitle} shop={shop} />
        </Suspense>
         <div className="page-content">
           {location.pathname.includes('call-settings') && (
             <Suspense fallback={<div style={{ height: '60px' }} />}>
               <CallSettingsPage shop={shop} />
             </Suspense>
           )}
           {!location.pathname.includes('call-settings') && children}
         </div>
      </main>
      {showFloatingButton && shop && (
        <Suspense fallback={null}>
          <UnifiedFloatingWidget shop={shop} />
          {/* Hidden buttons for unified widget to programmatically click */}
          <div className="hidden-widget-buttons">
            <FloatingTestCallButton shop={shop} />
            <HelpSupportWidget />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default Layout;

