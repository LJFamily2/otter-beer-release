import type { Metadata } from "next";
import { auth } from "@/auth";
import { userService } from "@/services/UserService";
import { roleService } from "@/services/RoleService";
import { MODULE_KEYS } from "@/config/permissions";
import { canManageRole, isSuperAdminRoleKey } from "@/config/roles";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import type { PopulatedRole } from "@/types/user";
import { AddUserModal } from "./AddUserModal";
import { UsersDirectory, type DirectoryUser } from "./UsersDirectory";

export const metadata: Metadata = {
  title: "Người dùng",
  robots: { index: false, follow: false },
};

export default async function UsersPage() {
  const session = await auth();
  const grant = session?.user?.permissions?.[MODULE_KEYS.USERS];

  if (!grant?.view) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        Bạn không có quyền xem nội dung này.
      </div>
    );
  }

  const actorLevel = session?.user?.roleLevel ?? Number.MAX_SAFE_INTEGER;

  const [users, roles] = await Promise.all([
    userService.list(),
    roleService.list(),
  ]);

  const total = users.length;
  const active = users.filter((user) => user.isActive).length;
  const inactive = total - active;

  const directoryUsers: DirectoryUser[] = users.map((user) => {
    const role = user.roleId as unknown as PopulatedRole;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      roleId: String(role?._id ?? ""),
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "—",
      // Whether the acting user outranks this user's CURRENT role — gates
      // showing edit/delete at all, not just which new role can be granted
      // (see the filtered roleOptions below). Without this, opening the
      // edit modal for a peer/superior user and saving without touching
      // the role field would still fail server-side, since the PATCH
      // always resubmits the current roleId.
      canManage: canManageRole(actorLevel, role?.level ?? -1),
      isSuperAdmin: isSuperAdminRoleKey(role?.key ?? ""),
    };
  });

  // Only roles the actor can actually grant — an admin must not be able to
  // promote someone to admin-or-above via this dropdown even if the Roles
  // & Permissions page correctly blocks it elsewhere (see config/roles.ts's
  // canManageRole()).
  const manageableRoles = roles.filter((role) =>
    canManageRole(actorLevel, role.level)
  );
  const roleOptions = manageableRoles.map((role) => ({
    value: String(role._id),
    label: role.name,
  }));

  const roleTabs = roles.map((role) => ({ key: role.key, label: role.name }));

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[{ label: "Quản trị", href: "/admin" }, { label: "Người dùng" }]}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(196,198,210,0.3)] pb-4">
        <div>
          <h1 className="text-4xl tracking-wide text-primary">
            Quản lý người dùng
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            Quản lý vai trò, quyền truy cập và danh bạ quản trị viên.
          </p>
        </div>
        {grant.add ? <AddUserModal roles={roleOptions} /> : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-secondary-container" />
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Tổng số người dùng
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">{total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Đang hoạt động
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">{active}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Đã vô hiệu hóa
          </div>
          <div className="mt-2 text-4xl tracking-wide text-primary">
            {inactive}
          </div>
        </Card>
      </div>

      <UsersDirectory
        users={directoryUsers}
        roleTabs={roleTabs}
        roleOptions={roleOptions}
        canEdit={Boolean(grant.edit)}
        canDelete={Boolean(grant.delete)}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}
