import {
  MODULE_KEYS_LIST,
  PERMISSION_ACTION_KEYS,
  fullAccessGrant,
  isKnownModuleKey,
  noAccessGrant,
} from "@/config/permissions";

describe("permissions config", () => {
  it("noAccessGrant() has every action set to false", () => {
    const grant = noAccessGrant();
    for (const action of PERMISSION_ACTION_KEYS) {
      expect(grant[action]).toBe(false);
    }
  });

  it("fullAccessGrant() has every action set to true", () => {
    const grant = fullAccessGrant();
    for (const action of PERMISSION_ACTION_KEYS) {
      expect(grant[action]).toBe(true);
    }
  });

  it("isKnownModuleKey recognizes registered modules and rejects unknown ones", () => {
    for (const key of MODULE_KEYS_LIST) {
      expect(isKnownModuleKey(key)).toBe(true);
    }
    expect(isKnownModuleKey("not_a_real_module")).toBe(false);
  });
});
