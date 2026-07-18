'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';

function subscribeToClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type ImageLightboxProps = {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
  closeLabel: string;
};

export function ImageLightbox({
  open,
  src,
  alt = '',
  onClose,
  closeLabel,
}: ImageLightboxProps) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!mounted || !open || !src) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || closeLabel}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <div
        className="relative max-h-[90vh] max-w-[min(100%,960px)]"
        onClick={(event) => event.stopPropagation()}
      >
        <AppImage
          src={src}
          alt={alt}
          width={960}
          height={960}
          className="max-h-[90vh] w-auto max-w-full rounded-[var(--radius-sm)] object-contain"
          unoptimized
        />
      </div>
    </div>,
    document.body,
  );
}
