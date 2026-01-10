import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet, WalletStatus } from './context/WalletContext';
import './index.css';

// Lazy-loaded page components - reduces initial bundle size
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Passphrase = lazy(() => import('./pages/Passphrase').then(m => ({ default: m.Passphrase })));
const ConfirmPassphrase = lazy(() => import('./pages/ConfirmPassphrase').then(m => ({ default: m.ConfirmPassphrase })));
const SetPin = lazy(() => import('./pages/SetPin').then(m => ({ default: m.SetPin })));
const ImportWallet = lazy(() => import('./pages/ImportWallet').then(m => ({ default: m.ImportWallet })));
const UnlockWallet = lazy(() => import('./pages/UnlockWallet').then(m => ({ default: m.UnlockWallet })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

/**
 * Loading fallback shown while lazy components load.
 */
function PageLoader() {
  return (
    <div className="page-container">
      <div className="page-content flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
}

/**
 * Root route handler - redirects based on wallet state.
 */
function RootRedirect() {
  const { status } = useWallet();

  if (status === WalletStatus.LOADING) {
    return <PageLoader />;
  }

  if (status === WalletStatus.UNLOCKED) {
    return <Navigate to="/dashboard" replace />;
  }

  if (status === WalletStatus.LOCKED) {
    return <Navigate to="/unlock" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Onboarding />
    </Suspense>
  );
}

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/passphrase" element={<Passphrase />} />
            <Route path="/confirm-passphrase" element={<ConfirmPassphrase />} />
            <Route path="/set-pin" element={<SetPin />} />
            <Route path="/import" element={<ImportWallet />} />
            <Route path="/unlock" element={<UnlockWallet />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
