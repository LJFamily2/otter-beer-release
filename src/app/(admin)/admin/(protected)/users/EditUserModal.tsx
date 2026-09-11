"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { EditIcon } from "@/components/admin/icons";
import { rowActionButtonClass } from "@/components/admin/classNames";

interface RoleOption {
  value: string;
  label: string;
}

interface EditableUser {
  id: string;
  name: string;
  roleId: string;
  isActive: boolean;
}

export function EditUserModal({
  user,
  roleOptions,
}: {
  user: EditableUser;
  roleOptions: RoleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(user.roleId);
  const [isActive, setIsActive] = useState(user.isActive);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, isActive }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể cập nhật người dùng.");
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
        className={rowActionButtonClass}
        aria-label="Sửa"
        onClick={() => setOpen(true)}
      >
        <EditIcon width={15} height={15} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Chỉnh sửa ${user.name}`}
        cancelLabel="Hủy"
        confirmLabel={isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        confirmDisabled={isSubmitting}
        onConfirm={handleSubmit}
      >
        <div className="mt-4 flex flex-col gap-4 text-left">
          {error ? (
            <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
              {error}
            </p>
          ) : null}
          <Select
            label="Vai trò"
            options={roleOptions}
            value={roleId}
            onChange={setRoleId}
          />
          <Select
            label="Trạng thái"
            value={String(isActive)}
            onChange={(v) => setIsActive(v === "true")}
            options={[
              { value: "true", label: "Đang hoạt động" },
              { value: "false", label: "Đã vô hiệu hóa" },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
