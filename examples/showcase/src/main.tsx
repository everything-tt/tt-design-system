import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@everything-tt/tt-players-design-system';
import '@everything-tt/tt-players-design-system/styles.css';
import './showcase.css';
import './app-shell-demo.css';
import './mobile-pwa-demo.css';
import './agent-skill-demo.css';
import { App } from './App';
import { AgentSkillDemo } from './AgentSkillDemo';
import { AppShellDemo } from './AppShellDemo';
import { MobilePwaDemo } from './MobilePwaDemo';

type ShowcaseMode = 'shell' | 'lab' | 'mobile' | 'skill';

function getModeFromHash(): ShowcaseMode {
  if (window.location.hash === '#lab') return 'lab';
  if (window.location.hash === '#mobile') return 'mobile';
  if (window.location.hash === '#skill') return 'skill';
  return 'shell';
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

  const openMobile = () => {
    window.location.hash = 'mobile';
    setMode('mobile');
  };

  const openSkill = () => {
    window.location.hash = 'skill';
    setMode('skill');
  };

  if (mode === 'mobile') {
    return <MobilePwaDemo onOpenShell={openShell} onOpenLab={openLab} onOpenSkill={openSkill} />;
  }

  if (mode === 'skill') {
    return <AgentSkillDemo onOpenShell={openShell} onOpenLab={openLab} onOpenMobile={openMobile} />;
  }

  if (mode === 'lab') {
    return (
      <>
        <div className="showcase-root-switch" aria-label="Showcase views">
          <button type="button" onClick={openShell}>App shell</button>
          <button type="button" onClick={openMobile}>Mobile / PWA</button>
          <button type="button" onClick={openSkill}>Agent skill</button>
        </div>
        <App />
      </>
    );
  }

  return (
    <>
      <div className="showcase-root-switch" aria-label="Showcase views">
        <button type="button" onClick={openMobile}>Mobile / PWA</button>
        <button type="button" onClick={openSkill}>Agent skill</button>
      </div>
      <AppShellDemo onOpenLab={openLab} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ShowcaseRoot />
    </ThemeProvider>
  </React.StrictMode>,
);
