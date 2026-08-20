import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@everything-tt/tt-players-design-system';
import '@everything-tt/tt-players-design-system/styles.css';
import './showcase.css';
import './app-shell-demo.css';
import { App } from './App';
import { AppShellDemo } from './AppShellDemo';

type ShowcaseMode = 'shell' | 'lab';

function getModeFromHash(): ShowcaseMode {
  return window.location.hash === '#lab' ? 'lab' : 'shell';
}

function ShowcaseRoot() {
  const [mode, setMode] = useState<ShowcaseMode>(getModeFromHash);

  useEffect(() => {
    const onHashChange = () => setMode(getModeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openShell = () => {
    window.location.hash = 'shell';
    setMode('shell');
  };

  const openLab = () => {
    window.location.hash = 'lab';
    setMode('lab');
  };

  if (mode === 'lab') {
    return (
      <>
        <div className="showcase-root-switch">
          <button type="button" onClick={openShell}>Open app shell</button>
        </div>
        <App />
      </>
    );
  }

  return <AppShellDemo onOpenLab={openLab} />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ShowcaseRoot />
    </ThemeProvider>
  </React.StrictMode>,
);
