export const DEFAULT_INSTALL_PROMPT_STORAGE_KEY = 'pwa-install-dismissed';
export const DEFAULT_INSTALL_PROMPT_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;

export function isInstallPromptDue(
  lastPrompt: string | null,
  now = Date.now(),
  cooldownMs = DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
): boolean {
  if (!lastPrompt) return true;
  const lastPromptAt = Number(lastPrompt);
  if (!Number.isFinite(lastPromptAt)) return true;
  return now - lastPromptAt >= cooldownMs;
}

export function isIOSUserAgent(userAgent: string, maxTouchPoints = 0): boolean {
  return /iPad|iPhone|iPod/.test(userAgent)
    || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}
