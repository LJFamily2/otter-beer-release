"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import { EditIcon } from "@/components/admin/icons";

export function RenameRoleModal({
  roleId,
  currentName,
}: {
  roleId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể đổi tên vai trò.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={buttonVariants("secondary", "sm")}
        onClick={() => setOpen(true)}
      >
        <EditIcon width={14} height={14} />
        Đổi tên
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Đổi tên vai trò"
        cancelLabel="Hủy"
        confirmLabel={isSubmitting ? "Đang lưu..." : "Lưu"}
        confirmDisabled={isSubmitting}
        onConfirm={handleSubmit}
      >
        <div className="mt-4 flex flex-col gap-4 text-left">
          {error ? (
            <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
              {error}
            </p>
          ) : null}
          <Input
            label="Tên vai trò"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </Modal>
    </>
  );
}
