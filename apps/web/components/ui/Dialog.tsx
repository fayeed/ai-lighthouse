'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className = '' }: DialogProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`relative z-10 w-full max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0a0a0a]">
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
