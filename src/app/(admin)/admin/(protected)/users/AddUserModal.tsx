"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PlusIcon } from "@/components/admin/icons";

interface RoleOption {
  value: string;
  label: string;
}

export function AddUserModal({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, roleId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể thêm người dùng.");
      }
      setOpen(false);
      setEmail("");
      setName("");
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
        Thêm người dùng
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm người dùng mới"
        cancelLabel="Hủy"
        confirmLabel={isSubmitting ? "Đang lưu..." : "Thêm người dùng"}
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Họ tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label="Vai trò"
            options={roles}
            value={roleId}
            onChange={setRoleId}
          />
        </div>
      </Modal>
    </>
  );
}
