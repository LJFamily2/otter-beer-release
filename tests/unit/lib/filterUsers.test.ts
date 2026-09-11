import { filterUsers, type FilterableUser } from "@/lib/utils/filterUsers";

const USERS: FilterableUser[] = [
  { name: "James Dempsey", email: "james@coastalbrew.com", roleKey: "admin" },
  { name: "Sarah Jenkins", email: "sarah.j@coastalbrew.com", roleKey: "office_member" },
  { name: "Michael Ross", email: "m.ross@example.com", roleKey: "office_member" },
];

describe("filterUsers", () => {
  it("returns everyone when no filter is given", () => {
    expect(filterUsers(USERS, {})).toHaveLength(3);
  });

  it("filters by role key", () => {
    const result = filterUsers(USERS, { roleKey: "office_member" });
    expect(result.map((u) => u.name)).toEqual(["Sarah Jenkins", "Michael Ross"]);
  });

  it("filters by search matching name, case-insensitively", () => {
    const result = filterUsers(USERS, { search: "james" });
    expect(result.map((u) => u.name)).toEqual(["James Dempsey"]);
  });

  it("filters by search matching email", () => {
    const result = filterUsers(USERS, { search: "example.com" });
    expect(result.map((u) => u.name)).toEqual(["Michael Ross"]);
  });

  it("combines role and search filters", () => {
    const result = filterUsers(USERS, { roleKey: "office_member", search: "sarah" });
    expect(result.map((u) => u.name)).toEqual(["Sarah Jenkins"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterUsers(USERS, { search: "nobody" })).toEqual([]);
  });
});
