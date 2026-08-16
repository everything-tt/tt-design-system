import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@everything-tt/tt-players-design-system';
import '@everything-tt/tt-players-design-system/styles.css';
import './showcase.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
