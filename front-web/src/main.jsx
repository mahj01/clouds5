import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import MapLeaflet from './components/MapLeaflet.jsx';
import MapPage from './pages/Map.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/map" element={<MapLeaflet />} />
        <Route path="/maplibre" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
