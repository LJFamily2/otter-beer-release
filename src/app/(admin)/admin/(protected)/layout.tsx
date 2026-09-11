import Link from "next/link";
import { auth, signOut } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { SYSTEM_ROLE_LABELS_VI, type SystemRoleKey } from "@/config/roles";
import { NewsBlogIcon, BeerIcon, BrandStoryIcon, HeroIcon, LogoutIcon, UsersIcon, ShieldIcon } from "@/components/admin/icons";
import { NavSidebar } from "@/components/ui/NavSidebar";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Shell for every authenticated admin page (sidebar + user card + logout).
 * Deliberately lives in a (protected) route group sibling to
 * admin/dang-nhap/ so the login page never gets wrapped in this chrome —
 * see src/proxy.ts for the actual auth gate.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const permissions = session?.user?.permissions;

  const navItems = [
    {
      key: MODULE_KEYS.NEWS_BLOG,
      href: "/admin/blog",
      label: "Tin tức & Blog",
      icon: <NewsBlogIcon />,
    },
    {
      key: MODULE_KEYS.HERO_SECTION,
      href: "/admin/hero",
      label: "Ảnh bìa trang chủ",
      icon: <HeroIcon />,
    },
    {
      key: MODULE_KEYS.BEERS,
      href: "/admin/beers",
      label: "Sản phẩm bia",
      icon: <BeerIcon />,
    },
    {
      key: MODULE_KEYS.BRAND_STORY,
      href: "/admin/brand-story",
      label: "Câu chuyện thương hiệu",
      icon: <BrandStoryIcon />,
    },
    {
      key: MODULE_KEYS.USERS,
      href: "/admin/users",
      label: "Người dùng",
      icon: <UsersIcon />,
    },
    {
      key: MODULE_KEYS.ROLES_PERMISSIONS,
      href: "/admin/roles",
      label: "Vai trò & Phân quyền",
      icon: <ShieldIcon />,
    },
  ].filter((item) => permissions?.[item.key]?.access);

  const initial = session?.user?.name?.charAt(0).toUpperCase() ?? "?";
  const roleKey = session?.user?.roleKey;
  const roleLabel = roleKey
    ? (SYSTEM_ROLE_LABELS_VI[roleKey as SystemRoleKey] ?? roleKey)
    : undefined;

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 h-dvh w-64 shrink-0 p-3 max-[900px]:hidden">
        <NavSidebar
          className="h-full"
          header={
            // NavSidebar's header slot wrapper applies font-display/uppercase
            // for single-line brand marks; this admin brand block is two
            // lines in the default body font/case, so both are reset here
            // rather than fighting the wrapper's styles per line.
            <div className="font-body normal-case">
              <div className="text-2xl leading-[1.3] tracking-wide text-primary">
                Otter Beer
              </div>
              <div className="mt-1 text-xs font-medium leading-[1.3] text-on-surface-variant">
                Cổng quản trị nội dung
              </div>
            </div>
          }
          items={navItems}
          footer={
            <div className="flex flex-col gap-1">
              <Link
                href="/admin/tai-khoan"
                className="flex items-center gap-2 rounded-md px-1 pb-2 pt-1 text-xs text-on-surface-variant no-underline hover:bg-surface-container"
              >
                <Avatar src={session?.user?.image ?? undefined} initials={initial} size="sm" />
                <div>
                  <div className="text-sm font-bold text-on-surface">
                    {session?.user?.name ?? "Không xác định"}
                  </div>
                  {roleLabel ? <div>{roleLabel}</div> : null}
                </div>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/dang-nhap" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold tracking-wide text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="h-[18px] w-[18px] shrink-0">
                    <LogoutIcon />
                  </span>
                  Đăng xuất
                </button>
              </form>
            </div>
          }
        />
      </aside>

      <main className="max-w-[1280px] flex-1 min-w-0 px-16 pb-16 pt-10 max-[900px]:px-5 max-[900px]:pb-8 max-[900px]:pt-6">
        {children}
      </main>
    </div>
  );
}
