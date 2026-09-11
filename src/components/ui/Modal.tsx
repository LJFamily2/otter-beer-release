"use client";

import type { ReactNode } from "react";
import { buttonVariants } from "./Button";

/**
 * Centered confirmation dialog with a blurred backdrop.
 * AI agents: customize via props (icon, title, description, cancelLabel,
 * confirmLabel, confirmDisabled, onConfirm, children), not by editing this
 * file's markup. See docs/component-library.md for the full prop reference.
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Disables the confirm button — e.g. while an async onConfirm submit is in flight. */
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  /** When true, uses a wider max-width (e.g. for tables). */
  wide?: boolean;
  children?: ReactNode;
}

export function Modal({
  open,
  onClose,
  icon,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmDisabled = false,
  onConfirm,
  wide = false,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/20 p-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-lg border border-outline-variant/20 bg-surface p-8 text-center shadow-md`}
        onClick={(e) => e.stopPropagation()}
      >
        {icon ? <div className="mb-4 flex justify-center text-primary">{icon}</div> : null}
        <h3 id="modal-title" className="font-display text-2xl tracking-wide text-primary uppercase">
          {title}
        </h3>
        {description ? <div className="mt-3 text-on-surface-variant">{description}</div> : null}
        {children}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className={`flex-1 ${buttonVariants("secondary")}`}>
            {cancelLabel}
          </button>
          {confirmLabel ? (
            <button
              type="button"
              onClick={onConfirm ?? onClose}
              disabled={confirmDisabled}
              className={`flex-1 ${buttonVariants("primary")}`}
            >
              {confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
