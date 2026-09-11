import type { Metadata } from "next";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import {
  MODULE_KEYS_LIST,
  MODULE_LABELS_VI,
  PERMISSION_ACTION_KEYS,
  PERMISSION_ACTION_LABELS_VI,
  type ModuleKey,
} from "@/config/permissions";
import { SYSTEM_ROLE_LABELS_VI, type SystemRoleKey } from "@/config/roles";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { CheckCircleIcon, CloseIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Tài khoản của tôi",
  robots: { index: false, follow: false },
};

/** Vietnamese label for a role key — falls back to the raw key for custom (non-system) roles, since those don't have a hardcoded label. */
function roleLabel(roleKey: string): string {
  return SYSTEM_ROLE_LABELS_VI[roleKey as SystemRoleKey] ?? roleKey;
}

interface PermissionRow {
  moduleKey: ModuleKey;
  moduleLabel: string;
}

export default async function AccountSettingsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        Vui lòng đăng nhập lại.
      </div>
    );
  }

  const initial = user.name?.charAt(0).toUpperCase() ?? "?";

  const rows: PermissionRow[] = MODULE_KEYS_LIST.map((moduleKey) => ({
    moduleKey,
    moduleLabel: MODULE_LABELS_VI[moduleKey],
  }));

  const columns: DataTableColumn<PermissionRow>[] = [
    {
      key: "module",
      header: "Trang",
      render: (row) => <span className="font-medium text-on-surface">{row.moduleLabel}</span>,
    },
    ...PERMISSION_ACTION_KEYS.map((action) => ({
      key: action,
      header: PERMISSION_ACTION_LABELS_VI[action],
      align: "left" as const,
      render: (row: PermissionRow) => {
        const granted = Boolean(user.permissions?.[row.moduleKey]?.[action]);
        return granted ? (
          <CheckCircleIcon width={18} height={18} className="text-[#10b981]" />
        ) : (
          <CloseIcon width={14} height={14} className="text-outline-variant" />
        );
      },
    })),
  ];

  return (
    <div className="flex max-w-[860px] flex-col gap-8">
      <Breadcrumbs
        items={[{ label: "Quản trị", href: "/admin" }, { label: "Tài khoản của tôi" }]}
      />

      <div className="border-b border-[rgba(196,198,210,0.3)] pb-4">
        <h1 className="text-4xl tracking-wide text-primary">Tài khoản của tôi</h1>
        <p className="mt-2 text-base text-on-surface-variant">
          Thông tin hồ sơ và quyền truy cập của bạn trong hệ thống.
        </p>
      </div>

      <Card className="flex flex-col gap-6 p-8">
        <div className="flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary font-display text-2xl text-on-primary">
            {user.image ? (
              <Image src={user.image} alt="" width={64} height={64} className="size-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div>
            <p className="font-display text-2xl tracking-wide text-primary">{user.name}</p>
            <p className="text-on-surface-variant">{user.email}</p>
            <Badge variant="primary" className="mt-2">
              {roleLabel(user.roleKey)}
            </Badge>
          </div>
        </div>
        <p className="rounded bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Hồ sơ này được đồng bộ tự động từ tài khoản Google của bạn khi đăng
          nhập để đổi tên hoặc ảnh đại diện, hãy cập nhật tài khoản Google
          của bạn.
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-wide text-primary">
          Quyền truy cập của bạn
        </h2>
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.moduleKey} />
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/admin/dang-nhap" });
        }}
      >
        <Button type="submit" variant="secondary">
          Đăng xuất
        </Button>
      </form>
    </div>
  );
}
