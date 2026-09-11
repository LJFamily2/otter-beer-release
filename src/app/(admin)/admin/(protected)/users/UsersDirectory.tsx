"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils/formatDate";
import { filterUsers } from "@/lib/utils/filterUsers";
import { SearchIcon, TrashIcon } from "@/components/admin/icons";
import { EditUserModal } from "./EditUserModal";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { UserPermissionsModal } from "./UserPermissionsModal";

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  /** Whether the acting user outranks this user's current role — see config/roles.ts's canManageRole(). Gates showing edit/delete at all. */
  canManage: boolean;
  /** Whether this user holds the superAdmin role. */
  isSuperAdmin: boolean;
}

interface RoleOption {
  value: string;
  label: string;
}

interface RoleTab {
  key: string;
  label: string;
}

/**
 * Client-side directory: role tabs + search both filter the already-fetched
 * list in the browser (see filterUsers.ts) rather than round-tripping to
 * the server — the admin user count doesn't warrant server-side pagination.
 */
export function UsersDirectory({
  users,
  roleTabs,
  roleOptions,
  canEdit,
  canDelete,
  currentUserId,
}: {
  users: DirectoryUser[];
  roleTabs: RoleTab[];
  roleOptions: RoleOption[];
  canEdit: boolean;
  canDelete: boolean;
  currentUserId: string;
}) {
  const [activeRole, setActiveRole] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      filterUsers(users, {
        roleKey: activeRole === "all" ? undefined : activeRole,
        search,
      }),
    [users, activeRole, search]
  );

  const columns: DataTableColumn<DirectoryUser>[] = [
    {
      key: "user",
      header: "Người dùng",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.image} initials={user.name.charAt(0).toUpperCase()} size="sm" />
          <div>
            <p className="font-medium text-on-surface">{user.name}</p>
            <p className="text-sm text-on-surface-variant">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (user) => <Badge variant="outline">{user.roleName}</Badge>,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (user) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot color={user.isActive ? "success" : "error"} />
          {user.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Tham gia",
      render: (user) => formatDate(new Date(user.createdAt), "vi"),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (user) => {
        if (user.id === currentUserId) {
          return (
            <span className="text-xs uppercase tracking-wide text-on-surface-variant">
              Tài khoản của bạn
            </span>
          );
        }
        if (!user.canManage) {
          return (
            <div className="inline-flex items-center gap-2">
              <UserPermissionsModal
                userId={user.id}
                userName={user.name}
                canEdit={false}
                isSuperAdmin={user.isSuperAdmin}
              />
              <span className="text-xs uppercase tracking-wide text-on-surface-variant">
                Vai trò cao hơn
              </span>
            </div>
          );
        }
        return (
          <div className="inline-flex justify-end gap-1">
            <UserPermissionsModal
              userId={user.id}
              userName={user.name}
              canEdit={canEdit}
              isSuperAdmin={user.isSuperAdmin}
            />
            {canEdit ? <EditUserModal user={user} roleOptions={roleOptions} /> : null}
            {canDelete ? (
              <ConfirmDeleteButton
                title="Xác nhận xóa người dùng"
                description="Xóa quyền truy cập của người dùng này? Hành động này không thể hoàn tác."
                deleteUrl={`/api/users/${user.id}`}
                useRowActionStyle
              >
                <TrashIcon width={15} height={15} />
              </ConfirmDeleteButton>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        variant="underline"
        value={activeRole}
        onChange={setActiveRole}
        items={[
          { value: "all", label: "Tất cả" },
          ...roleTabs.map((role) => ({ value: role.key, label: role.label })),
        ]}
      />
      <DataTable
        title="Danh bạ người dùng"
        columns={columns}
        rows={filtered}
        rowKey={(user) => user.id}
        emptyMessage={
          search || activeRole !== "all"
            ? "Không tìm thấy người dùng phù hợp."
            : "Chưa có người dùng nào."
        }
        action={
          <Input
            type="search"
            placeholder="Tìm theo tên hoặc email..."
            icon={<SearchIcon width={16} height={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="min-w-[260px]"
            className="py-2.5"
          />
        }
        footer={
          <span className="text-sm text-on-surface-variant">
            Hiển thị {filtered.length} trong tổng số {users.length} người dùng
          </span>
        }
      />
    </div>
  );
}
