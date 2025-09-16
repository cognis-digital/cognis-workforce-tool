
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './utils/react-hooks-globals';
import App from './App.tsx';
import './index.css';

// Initialize Evolution Architecture
import { initializeEvolutionArchitecture } from './evolution/utils/initialization';

// Initialize polyfills and architecture before rendering
initializeEvolutionArchitecture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
