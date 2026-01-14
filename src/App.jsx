import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorBoundary from './components/ErrorBoundary';
import TailwindTest from './pages/TailwindTest';

// Lazy load all components to prevent module-level initialization errors
const Layout = lazy(() => import('./components/Layout'));
const Dashboard2 = lazy(() => import('./pages/Dashboard2'));
const Playground = lazy(() => import('./pages/Playground'));
const ScriptRefining = lazy(() => import('./pages/ScriptRefining'));
const FinetuneLLM = lazy(() => import('./pages/FinetuneLLM'));
const Scripts = lazy(() => import('./pages/Scripts'));
const CallHistory = lazy(() => import('./pages/CallHistory'));
const Stats = lazy(() => import('./pages/Stats'));
const Usage = lazy(() => import('./pages/Usage'));
const Settings = lazy(() => import('./pages/Settings'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Voices = lazy(() => import('./pages/Voices'));
const CloneVoice = lazy(() => import('./pages/CloneVoice'));
const PhoneNumbers = lazy(() => import('./pages/PhoneNumbers'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Info = lazy(() => import('./pages/Info'));
const TourSetup = lazy(() => import('./pages/TourSetup'));
const SetupGuide = lazy(() => import('./pages/SetupGuide'));
const TimeCalculator = lazy(() => import('./pages/TimeCalculator'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails'));
const AllOrders = lazy(() => import('./pages/AllOrders'));
const Ndr = lazy(() => import('./pages/Ndr'));
const NonCampaignOrders = lazy(() => import('./pages/NonCampaignOrders'));
const RtoAnalysis = lazy(() => import('./pages/RtoAnalysis'));
const RunSimulation = lazy(() => import('./pages/RunSimulation'));
const TestCall = lazy(() => import('./pages/TestCall'));
const Templates = lazy(() => import('./pages/Templates'));
const CallSettings = lazy(() => import('./pages/CallSettings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Export components for direct imports in other files

const LoadingFallback = () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

function App() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shop = searchParams.get('shop');

  // Check if current route is login/register or tailwind-test (don't use Layout for these)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/tailwind-test';

  return (
    <>
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tailwind-test" element={<TailwindTest />} />
        </Routes>
      ) : (
        <Suspense fallback={<LoadingFallback />}>
          <Layout shop={shop}>
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/onboarding" element={<Onboarding shop={shop} />} />
                  <Route path="/dashboard2.0" element={<Dashboard2 shop={shop} />} />
                  <Route path="/playground" element={<Playground shop={shop} />} />
                <Route path="/script-refining" element={<ScriptRefining shop={shop} />} />
                <Route path="/finetune-llm" element={<FinetuneLLM shop={shop} />} />
                <Route path="/scripts" element={<Scripts shop={shop} />} />
                <Route path="/call-history" element={<CallHistory shop={shop} />} />
                <Route path="/stats" element={<Stats shop={shop} />} />
                <Route path="/usage" element={<Usage shop={shop} />} />
                <Route path="/settings" element={<Settings shop={shop} />} />
                <Route path="/integrations" element={<Integrations shop={shop} />} />
                <Route path="/voices" element={<Voices shop={shop} />} />
                <Route path="/clone-voice" element={<CloneVoice shop={shop} />} />
                <Route path="/phone-numbers" element={<PhoneNumbers shop={shop} />} />
                <Route path="/pricing" element={<Pricing shop={shop} />} />
                <Route path="/info" element={<Info />} />
                <Route path="/tour-setup" element={<TourSetup shop={shop} />} />
                <Route path="/setup-guide" element={<SetupGuide shop={shop} />} />
                <Route path="/time-calculator" element={<TimeCalculator shop={shop} />} />
                   <Route path="/campaigns" element={<Campaigns shop={shop} />} />
                   <Route path="/campaigns/:campaignId" element={<CampaignDetails shop={shop} />} />
                   <Route path="/all-orders" element={<AllOrders shop={shop} />} />
                   <Route path="/ndr" element={<Ndr shop={shop} />} />
                   <Route path="/non-campaign-orders" element={<NonCampaignOrders shop={shop} />} />
                   <Route path="/rto-analysis" element={<RtoAnalysis shop={shop} />} />
                   <Route path="/run-simulation" element={<RunSimulation shop={shop} />} />
                   <Route path="/test-call" element={<TestCall shop={shop} />} />
                   <Route path="/templates" element={<Templates shop={shop} />} />
                   <Route path="/call-settings" element={<CallSettings shop={shop} />} />
                {/* Performance, AiCalls, and Dashboard are not migrated - kept as EJS */}
                <Route path="/" element={<Navigate to="/dashboard2.0" replace />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </Layout>
        </Suspense>
      )}
    </>
  );
}

export default App;

