"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon } from "@/components/admin/icons";

export function CreateRoleModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể tạo vai trò.");
      }
      const created = await response.json();
      setOpen(false);
      setKey("");
      setName("");
      router.push(`/admin/roles?roleId=${created._id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon width={14} height={14} />
        Tạo vai trò mới
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tạo vai trò mới"
        cancelLabel="Hủy"
        confirmLabel={isSubmitting ? "Đang tạo..." : "Tạo vai trò"}
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
          <Input
            label="Khóa (chữ thường, gạch dưới)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="vi_du_vai_tro"
            hint="Dùng nội bộ trong hệ thống, không thể đổi sau khi tạo."
            required
          />
        </div>
      </Modal>
    </>
  );
}
