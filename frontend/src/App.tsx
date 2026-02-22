import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import './i18n/config';

// Lazy load pages
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const StylePage = React.lazy(() => import('./pages/StylePage'));
const RecommendPage = React.lazy(() => import('./pages/RecommendPage'));
const FittingPage = React.lazy(() => import('./pages/FittingPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const RoutePage = React.lazy(() => import('./pages/RoutePage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const showHeader = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-0 sm:pt-4 sm:pb-4">
      {/* Mobile Container Limiter - Fixed width on desktop, full on mobile */}
      <div className="w-full sm:max-w-[430px] bg-white h-screen sm:h-[800px] sm:rounded-[32px] sm:overflow-hidden shadow-2xl relative flex flex-col border-gray-200 sm:border">

        {showHeader && <Header />}

        <main className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
          <Suspense fallback={<div className="h-full flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/style" element={<StylePage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/fitting" element={<FittingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/route" element={<RoutePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
