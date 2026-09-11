"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldIcon } from "@/components/admin/icons";
import { rowActionButtonClass } from "@/components/admin/classNames";
import {
  MODULE_KEYS_LIST,
  MODULE_LABELS_VI,
  PERMISSION_ACTION_KEYS,
  PERMISSION_ACTION_LABELS_VI,
  type ActionGrant,
  type ModuleKey,
} from "@/config/permissions";
import type { PermissionMatrix } from "@/services/PermissionService";

export function UserPermissionsModal({
  userId,
  userName,
  canEdit,
  isSuperAdmin,
}: {
  userId: string;
  userName: string;
  canEdit: boolean;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setIsLoading(true);
    setError(null);
    setSaved(false);
  };

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    fetch(`/api/permissions?userId=${userId}`)
      .then(async (res) => {
        if (ignore) return;
        if (!res.ok) throw new Error("Không thể tải quyền truy cập.");
        const data = await res.json();
        if (ignore) return;
        setMatrix(data.matrix);
        setIsCustom(Boolean(data.isCustom));
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [open, userId]);

  function toggle(moduleKey: ModuleKey, action: keyof ActionGrant) {
    if (!matrix) return;
    setSaved(false);
    setMatrix((prev) => {
      if (!prev) return prev;
      const current = prev[moduleKey];
      const newValue = !current[action];
      const updated = { ...current, [action]: newValue };

      if (action === "access" && !newValue) {
        updated.view = false;
        updated.add = false;
        updated.edit = false;
        updated.delete = false;
      } else if (
        (action === "add" || action === "edit" || action === "delete" || action === "view") &&
        newValue
      ) {
        updated.access = true;
        updated.view = true;
      }

      return {
        ...prev,
        [moduleKey]: updated,
      };
    });
  }

  async function handleSave() {
    if (!matrix) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          grants: MODULE_KEYS_LIST.map((moduleKey) => ({
            moduleKey,
            actions: matrix[moduleKey],
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể lưu quyền truy cập.");
      }
      const data = await response.json();
      setMatrix(data.matrix);
      setIsCustom(true);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetToDefaults() {
    setError(null);
    setIsResetting(true);
    try {
      const response = await fetch(`/api/permissions?userId=${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể đặt lại quyền mặc định.");
      }
      const data = await response.json();
      setMatrix(data.matrix);
      setIsCustom(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={rowActionButtonClass}
        aria-label="Phân quyền"
        onClick={handleOpen}
      >
        <ShieldIcon width={15} height={15} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Phân quyền — ${userName}`}
        cancelLabel="Đóng"
        confirmLabel={canEdit && !isSuperAdmin ? (isSaving ? "Đang lưu..." : "Lưu quyền tùy chỉnh") : undefined}
        confirmDisabled={isSaving || isResetting}
        onConfirm={canEdit && !isSuperAdmin ? handleSave : undefined}
        wide
      >
        <div className="mt-4 flex flex-col gap-4 text-left">
          {error ? (
            <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
              {error}
            </p>
          ) : null}

          {isSuperAdmin ? (
            <p className="rounded bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              Vai trò Quản trị viên cấp cao luôn có toàn quyền trên mọi mô-đun
              và không thể chỉnh sửa.
            </p>
          ) : !canEdit ? (
            <p className="rounded bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              Vai trò này ngang cấp hoặc cao hơn vai trò của bạn chỉ xem,
              không thể chỉnh sửa.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span>Trạng thái:</span>
                {isCustom ? (
                  <Badge variant="primary">Quyền tùy chỉnh (Override)</Badge>
                ) : (
                  <Badge variant="outline">Quyền mặc định theo vai trò</Badge>
                )}
              </div>
              {isCustom ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetToDefaults}
                  disabled={isResetting || isSaving}
                  className="py-1 text-xs"
                >
                  {isResetting ? "Đang đặt lại..." : "Đặt lại về mặc định vai trò"}
                </Button>
              ) : null}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-on-surface-variant">Đang tải...</div>
            </div>
          ) : matrix ? (
            <div className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                      <th className="px-6 py-4 text-left text-[13px] font-medium uppercase tracking-wide text-on-surface-variant">
                        Trang
                      </th>
                      {PERMISSION_ACTION_KEYS.map((action) => (
                        <th
                          key={action}
                          className="px-6 py-4 text-left text-[13px] font-medium uppercase tracking-wide text-on-surface-variant"
                        >
                          {PERMISSION_ACTION_LABELS_VI[action]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_KEYS_LIST.map((moduleKey) => (
                      <tr key={moduleKey} className="border-t border-outline-variant/10">
                        <td className="px-6 py-4 font-medium text-on-surface">
                          {MODULE_LABELS_VI[moduleKey]}
                        </td>
                        {PERMISSION_ACTION_KEYS.map((action) => (
                          <td key={action} className="px-6 py-4">
                            <Checkbox
                              checked={matrix[moduleKey][action]}
                              disabled={!canEdit || isSuperAdmin}
                              onChange={() => toggle(moduleKey, action)}
                              aria-label={`${MODULE_LABELS_VI[moduleKey]} - ${PERMISSION_ACTION_LABELS_VI[action]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {canEdit && !isSuperAdmin ? (
                <div className="flex flex-wrap items-center gap-4 border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
                  {saved && !error ? (
                    <p className="text-sm text-[#10b981]">Đã cập nhật quyền thành công.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
