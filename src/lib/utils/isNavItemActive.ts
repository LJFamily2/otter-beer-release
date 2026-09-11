/**
 * Whether a nav item's href matches the current pathname — exact match, or
 * a parent of a nested route (e.g. href "/admin/blog" is active for both
 * "/admin/blog" and "/admin/blog/moi"). Shared by NavSidebar's route-aware
 * default and any future nav component that needs the same rule.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
