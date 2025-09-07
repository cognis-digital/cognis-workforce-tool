// Import polyfills first to ensure they're applied before any code runs
import './polyfills';

// Setup error handlers for browser extensions
import { setupRuntimeErrorHandlers } from './utils/errorHandlers';
setupRuntimeErrorHandlers();

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
