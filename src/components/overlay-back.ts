import { useCallback } from 'react';

/**
 * Router-neutral Back integration for controlled overlays. Call the returned
 * function from the consuming router/history Back interceptor. `true` means
 * the Back action was consumed by closing the overlay.
 */
export function useOverlayBackHandler(isOpen: boolean, onClose: () => void) {
  return useCallback(() => {
    if (!isOpen) return false;
    onClose();
    return true;
  }, [isOpen, onClose]);
}
