"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TrashIcon } from "@/components/admin/icons";
import { rowActionButtonClass } from "@/components/admin/classNames";

interface ConfirmDeleteButtonProps {
  title: string;
  description: string;
  deleteUrl: string;
  redirectUrl?: string;
  onSuccess?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  useRowActionStyle?: boolean;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ConfirmDeleteButton({
  title,
  description,
  deleteUrl,
  redirectUrl,
  onSuccess,
  variant = "secondary",
  size = "sm",
  useRowActionStyle = false,
  children,
  className = "",
  ariaLabel = "Xóa",
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Xóa thất bại.");
      }
      setOpen(false);
      onSuccess?.();
      if (redirectUrl) {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {useRowActionStyle ? (
        <button
          type="button"
          className={`${rowActionButtonClass} ${className}`}
          aria-label={ariaLabel}
          onClick={() => setOpen(true)}
        >
          {children ?? <TrashIcon width={15} height={15} />}
        </button>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          aria-label={ariaLabel}
          onClick={() => setOpen(true)}
        >
          {children ?? (
            <>
              <TrashIcon width={14} height={14} />
              Xóa
            </>
          )}
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        cancelLabel="Hủy"
        confirmLabel={isDeleting ? "Đang xóa..." : "Xóa"}
        confirmDisabled={isDeleting}
        onConfirm={handleConfirmDelete}
      >
        {error ? (
          <p className="mt-4 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
