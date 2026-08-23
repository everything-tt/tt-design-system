import type { ReactNode } from 'react';
import { AppButton } from '../components/AppButton';
import { BottomSheet } from '../components/BottomSheet';
import { usePWA } from './runtime';

export interface PWAInstallPromptProps {
  appName: string;
  iconSrc?: string;
  iconAlt?: string;
  title?: string;
  eyebrow?: string;
  installCopy?: ReactNode;
  iosCopy?: ReactNode;
  installLabel?: string;
  dismissLabel?: string;
}

export function PWAInstallPrompt({
  appName,
  iconSrc,
  iconAlt = '',
  title = `${appName} on Home Screen`,
  eyebrow = 'Install app',
  installCopy,
  iosCopy,
  installLabel = 'Add to Home Screen',
  dismissLabel = 'Maybe later',
}: PWAInstallPromptProps) {
  const { showInstallSheet, showIosSheet, install, dismissInstall } = usePWA();
  const isOpen = showInstallSheet || showIosSheet;
  const defaultCopy = `Install ${appName} on your home screen, and access it just like a regular app.`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={dismissInstall}
      title={title}
      eyebrow={eyebrow}
      height="auto"
      className="tt-pwa-sheet"
    >
      <div className="tt-pwa-sheet__content">
        {iconSrc ? (
          <img
            className="tt-pwa-sheet__icon"
            src={iconSrc}
            alt={iconAlt}
            width="90"
            height="90"
          />
        ) : null}
        <div className="tt-pwa-sheet__copy">
          {showIosSheet
            ? (iosCopy ?? <p>{defaultCopy} Open your Safari menu and tap <strong>Add to Home Screen</strong>.</p>)
            : (installCopy ?? <p>{defaultCopy}</p>)}
        </div>
        <div className="tt-pwa-sheet__actions">
          {showInstallSheet ? (
            <AppButton onClick={() => void install()} full>
              {installLabel}
            </AppButton>
          ) : null}
          <AppButton onClick={dismissInstall} tone="ghost" full>
            {dismissLabel}
          </AppButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export interface PWAUpdatePromptProps {
  title?: string;
  eyebrow?: string;
  copy?: ReactNode;
  updateLabel?: string;
  dismissLabel?: string;
}

export function PWAUpdatePrompt({
  title = 'Update available',
  eyebrow = 'App update',
  copy = <p>A newer version is available. Reload to use the latest version.</p>,
  updateLabel = 'Update Now',
  dismissLabel = 'Maybe later',
}: PWAUpdatePromptProps) {
  const { showUpdateSheet, updateApp, dismissUpdate } = usePWA();

  return (
    <BottomSheet
      isOpen={showUpdateSheet}
      onClose={dismissUpdate}
      title={title}
      eyebrow={eyebrow}
      height="auto"
      className="tt-pwa-sheet"
    >
      <div className="tt-pwa-sheet__content">
        <div className="tt-pwa-sheet__copy">{copy}</div>
        <div className="tt-pwa-sheet__actions">
          <AppButton onClick={() => void updateApp()} full>
            {updateLabel}
          </AppButton>
          <AppButton onClick={dismissUpdate} tone="ghost" full>
            {dismissLabel}
          </AppButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export interface PWAPromptsProps {
  appName: string;
  appIcon?: string;
  install?: Omit<PWAInstallPromptProps, 'appName' | 'iconSrc'>;
  update?: PWAUpdatePromptProps;
}

export function PWAPrompts({ appName, appIcon, install, update }: PWAPromptsProps) {
  return (
    <>
      <PWAInstallPrompt appName={appName} iconSrc={appIcon} {...install} />
      <PWAUpdatePrompt {...update} />
    </>
  );
}
