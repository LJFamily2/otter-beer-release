"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import {
  MODULE_KEYS_LIST,
  MODULE_LABELS_VI,
  PERMISSION_ACTION_KEYS,
  PERMISSION_ACTION_LABELS_VI,
  type ActionGrant,
  type ModuleKey,
} from "@/config/permissions";
import type { PermissionMatrix } from "@/services/PermissionService";

export function PermissionMatrixEditor({
  roleId,
  initialMatrix,
  canEdit,
}: {
  roleId: string;
  initialMatrix: PermissionMatrix;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [matrix, setMatrix] = useState<PermissionMatrix>(initialMatrix);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);


  function toggle(moduleKey: ModuleKey, action: keyof ActionGrant) {
    setSaved(false);
    setMatrix((prev) => {
      const current = prev[moduleKey];
      const newValue = !current[action];
      const updated = { ...current, [action]: newValue };

      // Smart dependency rules for intuitive UI:
      if (action === "access" && !newValue) {
        // Turning off access turns off all child permissions
        updated.view = false;
        updated.add = false;
        updated.edit = false;
        updated.delete = false;
      } else if (
        (action === "add" || action === "edit" || action === "delete" || action === "view") &&
        newValue
      ) {
        // Turning on view/add/edit/delete automatically turns on access & view
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
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          grants: MODULE_KEYS_LIST.map((moduleKey) => ({
            moduleKey,
            actions: matrix[moduleKey],
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Không thể lưu quyền mặc định của vai trò.");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
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
                      disabled={!canEdit}
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
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
          {error ? <p className="text-sm text-error">{error}</p> : null}
          {saved && !error ? <p className="text-sm text-[#10b981]">Đã lưu quyền mặc định.</p> : null}
          <Button type="button" onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving ? "Đang lưu..." : "Lưu quyền mặc định"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
