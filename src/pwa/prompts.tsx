import { useEffect, type ReactNode } from 'react';
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
  failureCopy?: ReactNode;
  repairFailureCopy?: ReactNode;
  updateLabel?: string;
  retryLabel?: string;
  repairLabel?: string;
  retryRepairLabel?: string;
  dismissLabel?: string;
}

export function PWAUpdatePrompt({
  title = 'Update available',
  eyebrow = 'App update',
  copy = <p>A newer version is available. Reload to use the latest version.</p>,
  failureCopy = <p>The update could not be applied. You can keep using the current version, try again, or repair the app installation.</p>,
  repairFailureCopy = <p>The app could not repair itself automatically. You can try the repair again or keep using the current version.</p>,
  updateLabel = 'Update Now',
  retryLabel = 'Try again',
  repairLabel = 'Repair app',
  retryRepairLabel = 'Try repair again',
  dismissLabel = 'Maybe later',
}: PWAUpdatePromptProps) {
  const { showUpdateSheet, updateApp, repairApp, dismissUpdate, updateState } = usePWA();
  const isUpdating = updateState.status === 'updating';
  const isRepairing = updateState.status === 'repairing';
  const isBusy = isUpdating || isRepairing;
  const failedOperation = updateState.status === 'failed' ? updateState.operation : null;
  const body = failedOperation === 'repair'
    ? repairFailureCopy
    : failedOperation === 'update'
      ? failureCopy
      : copy;
  const primaryLabel = isUpdating
    ? 'Updating…'
    : isRepairing
      ? 'Repairing…'
      : failedOperation === 'repair'
        ? retryRepairLabel
        : failedOperation === 'update'
          ? retryLabel
          : updateLabel;
  const runPrimaryAction = () => {
    if (failedOperation === 'repair') {
      void repairApp();
      return;
    }
    void updateApp();
  };

  return (
    <BottomSheet
      isOpen={showUpdateSheet}
      onClose={isBusy ? () => {} : dismissUpdate}
      title={failedOperation ? 'Update needs attention' : title}
      eyebrow={eyebrow}
      height="auto"
      className="tt-pwa-sheet"
    >
      <div className="tt-pwa-sheet__content">
        <div className="tt-pwa-sheet__copy">{body}</div>
        <div className="tt-pwa-sheet__actions">
          <AppButton onClick={runPrimaryAction} loading={isBusy} full>
            {primaryLabel}
          </AppButton>
          {failedOperation === 'update' ? (
            <AppButton onClick={() => void repairApp()} tone="outline" full>
              {repairLabel}
            </AppButton>
          ) : null}
          <AppButton onClick={dismissUpdate} tone="ghost" disabled={isBusy} full>
            {dismissLabel}
          </AppButton>
        </div>
      </div>
    </BottomSheet>
  );
}

export interface PWAUpdateNoticeProps {
  message?: ReactNode;
  durationMs?: number;
}

export function PWAUpdateNotice({
  message = 'Updated to the latest version',
  durationMs = 4000,
}: PWAUpdateNoticeProps) {
  const { showUpdatedNotice, dismissUpdatedNotice } = usePWA();

  useEffect(() => {
    if (!showUpdatedNotice || durationMs <= 0) return undefined;
    const timeout = setTimeout(dismissUpdatedNotice, durationMs);
    return () => clearTimeout(timeout);
  }, [dismissUpdatedNotice, durationMs, showUpdatedNotice]);

  if (!showUpdatedNotice) return null;

  return (
    <div className="tt-pwa-update-notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export interface PWAPromptsProps {
  appName: string;
  appIcon?: string;
  install?: Omit<PWAInstallPromptProps, 'appName' | 'iconSrc'>;
  update?: PWAUpdatePromptProps;
  updated?: PWAUpdateNoticeProps;
}

export function PWAPrompts({ appName, appIcon, install, update, updated }: PWAPromptsProps) {
  return (
    <>
      <PWAInstallPrompt appName={appName} iconSrc={appIcon} {...install} />
      <PWAUpdatePrompt {...update} />
      <PWAUpdateNotice {...updated} />
    </>
  );
}
