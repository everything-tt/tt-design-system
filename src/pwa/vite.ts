export const DEFAULT_PWA_ASSETS = [
  'favicon.ico',
  'apple-touch-icon.png',
  'masked-icon.svg',
] as const;

export const DEFAULT_PWA_GLOB_PATTERNS = [
  '**/*.{js,css,html,ico,png,svg,woff,woff2}',
] as const;

export interface SharedPWAWorkboxOptions {
  globPatterns?: string[];
}

export interface SharedPWAPluginOptions {
  registerType?: 'prompt' | 'autoUpdate';
  includeAssets?: string[];
  workbox?: SharedPWAWorkboxOptions;
}

/**
 * Applies the TT application defaults while preserving every app-specific
 * vite-plugin-pwa option inferred on the input object.
 *
 * Usage: VitePWA(withPWADefaults({ manifest: { ... } }))
 */
export function withPWADefaults<T extends SharedPWAPluginOptions>(
  options: T,
): T & {
  registerType: 'prompt' | 'autoUpdate';
  includeAssets: string[];
  workbox: SharedPWAWorkboxOptions;
} {
  const {
    registerType = 'prompt',
    includeAssets = [...DEFAULT_PWA_ASSETS],
    workbox,
    ...rest
  } = options;

  return {
    ...rest,
    registerType,
    includeAssets,
    workbox: {
      globPatterns: [...DEFAULT_PWA_GLOB_PATTERNS],
      ...(workbox ?? {}),
    },
  } as T & {
    registerType: 'prompt' | 'autoUpdate';
    includeAssets: string[];
    workbox: SharedPWAWorkboxOptions;
  };
}
