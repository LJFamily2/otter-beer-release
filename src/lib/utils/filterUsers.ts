export interface FilterableUser {
  name: string;
  email: string;
  roleKey: string;
}

export interface UserFilter {
  /** Role key to restrict to, or omit/undefined for "all roles". */
  roleKey?: string;
  /** Case-insensitive match against name or email. */
  search?: string;
}

/** Client-side directory filtering for the admin Users page — the full list is already fetched, so filtering by role tab or search text doesn't need a server round-trip. */
export function filterUsers<T extends FilterableUser>(
  users: T[],
  { roleKey, search }: UserFilter
): T[] {
  let result = users;

  if (roleKey) {
    result = result.filter((user) => user.roleKey === roleKey);
  }

  const query = search?.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  return result;
}
