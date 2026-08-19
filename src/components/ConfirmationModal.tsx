import type { ReactNode } from 'react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { AppButton } from './AppButton';
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from './ui/dialog';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'danger' | 'warning' | 'primary';
  isDestructive?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone,
  isDestructive = false,
  loading = false,
  children,
}: ConfirmationModalProps) {
  const effectiveTone = tone ?? (isDestructive ? 'danger' : 'primary');

  const renderIcon = () => {
    if (effectiveTone === 'danger') {
      return <Trash2 className="tt-confirmation-dialog__icon" aria-hidden="true" />;
    }
    if (effectiveTone === 'warning') {
      return <AlertTriangle className="tt-confirmation-dialog__icon" aria-hidden="true" />;
    }
    return <Info className="tt-confirmation-dialog__icon" aria-hidden="true" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onCancel(); }}>
      <DialogPortal>
        <DialogOverlay className="tt-confirmation-backdrop" />
        <DialogContent
          role="alertdialog"
          showCloseButton={false}
          className="tt-confirmation-dialog"
          onEscapeKeyDown={(event) => { if (loading) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (loading) event.preventDefault(); }}
        >
          <div className="tt-confirmation-dialog__body">
            <div className={`tt-confirmation-dialog__badge tt-confirmation-dialog__badge--${effectiveTone}`}>
              {renderIcon()}
            </div>
            <DialogTitle className="tt-confirmation-dialog__title">{title}</DialogTitle>
            <DialogDescription asChild>
              <div className="tt-confirmation-dialog__message">{message}</div>
            </DialogDescription>
            {children}
          </div>

          <div className="tt-confirmation-dialog__actions">
            <AppButton
              type="button"
              tone="outline"
              size="m"
              full
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </AppButton>
            <AppButton
              type="button"
              tone={effectiveTone === 'danger' ? 'danger' : 'primary'}
              size="m"
              full
              loading={loading}
              disabled={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
