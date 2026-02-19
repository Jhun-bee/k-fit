import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import StylePage from './pages/StylePage';
import RecommendPage from './pages/RecommendPage';
import FittingPage from './pages/FittingPage';
import MapPage from './pages/MapPage';
import RoutePage from './pages/RoutePage';
import './i18n/i18n';

function App() {
  return (
    <Router>
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden">
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/style" element={<StylePage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="/fitting" element={<FittingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/route" element={<RoutePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
