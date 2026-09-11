/**
 * @jest-environment node
 *
 * Security Test Suite: User Role & Permission Access Control
 * Verifies that:
 * 1. Unauthenticated and unauthorized users are blocked at the RouteGuard level (401 / 403).
 * 2. Each user account can strictly only perform actions allowed by their permission matrix.
 * 3. Per-user permission isolation guarantees User A's permissions never bleed into User B's account.
 * 4. Role hierarchy checks (canManageRole) prevent privilege escalation.
 * 5. SuperAdmin immunity prevents accidental or malicious lockout.
 */

import { NextRequest, NextResponse } from "next/server";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { auth } from "@/auth";
import { PermissionService } from "@/services/PermissionService";
import { canManageRole } from "@/config/roles";
import {
  MODULE_KEYS,
  noAccessGrant,
  fullAccessGrant,
} from "@/config/permissions";
import { Types } from "mongoose";
import { PermissionModel } from "@/models/Permission";
import type { PermissionRepository } from "@/repositories/PermissionRepository";
import type { RoleRepository } from "@/repositories/RoleRepository";
import type { UserRepository } from "@/repositories/UserRepository";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("Security: Role & Permission Access Control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. RouteGuard Access Control & Security Edge", () => {
    const dummyHandler = jest.fn().mockImplementation(() =>
      NextResponse.json({ success: true }, { status: 200 })
    );

    it("SEC-01: Blocks unauthenticated requests with 401 Unauthorized", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const guardedHandler = RouteGuard.requirePermission(
        MODULE_KEYS.NEWS_BLOG,
        "view",
        dummyHandler
      );

      const req = new NextRequest("http://localhost:3000/api/news-blog");
      const res = await guardedHandler(req, {});

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
      expect(dummyHandler).not.toHaveBeenCalled();
    });

    it("SEC-02: Obfuscates unauthorized actions as 404 Not Found (hiding route existence from unauthorized users)", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "user_view_only",
          roleKey: "office_member",
          roleLevel: 2,
          permissions: {
            [MODULE_KEYS.NEWS_BLOG]: {
              ...noAccessGrant(),
              access: true,
              view: true, // view = true, add/edit/delete = false
            },
          },
        },
      });

      const guardedDelete = RouteGuard.requirePermission(
        MODULE_KEYS.NEWS_BLOG,
        "delete",
        dummyHandler
      );

      const req = new NextRequest("http://localhost:3000/api/news-blog/123", {
        method: "DELETE",
      });
      const res = await guardedDelete(req, {});

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Not found");
      expect(dummyHandler).not.toHaveBeenCalled();
    });

    it("SEC-03: Allows authorized requests when user possesses the exact required action grant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: "user_editor",
          roleKey: "office_member",
          roleLevel: 2,
          permissions: {
            [MODULE_KEYS.NEWS_BLOG]: {
              ...noAccessGrant(),
              access: true,
              view: true,
              edit: true,
            },
          },
        },
      });

      const guardedEdit = RouteGuard.requirePermission(
        MODULE_KEYS.NEWS_BLOG,
        "edit",
        dummyHandler
      );

      const req = new NextRequest("http://localhost:3000/api/news-blog/123", {
        method: "PATCH",
      });
      const res = await guardedEdit(req, {});

      expect(res.status).toBe(200);
      expect(dummyHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Per-User Permission Isolation & Custom Overrides", () => {
    it("SEC-04: User A with custom grant can perform action, while User B with role default is restricted", async () => {
      const userAId = new Types.ObjectId();
      const userBId = new Types.ObjectId();
      const roleId = new Types.ObjectId();

      // User A has custom override row allowing news_blog delete
      const userARows = [
        new PermissionModel({
          userId: userAId,
          moduleKey: MODULE_KEYS.NEWS_BLOG,
          actions: { access: true, view: true, add: true, edit: true, delete: true },
        }),
      ];

      const permissionRepo = {
        findByUser: jest.fn().mockImplementation((id) => {
          if (String(id) === String(userAId)) return Promise.resolve(userARows);
          return Promise.resolve([]); // User B has no custom overrides
        }),
        findByRole: jest.fn().mockResolvedValue([
          new PermissionModel({
            roleId,
            moduleKey: MODULE_KEYS.NEWS_BLOG,
            actions: { access: true, view: true, add: false, edit: false, delete: false },
          }),
        ]),
      } as unknown as PermissionRepository;

      const roleRepo = {
        findByKey: jest.fn().mockResolvedValue({ _id: roleId, key: "office_member" }),
      } as unknown as RoleRepository;

      const userRepo = {} as UserRepository;

      const service = new PermissionService(permissionRepo, roleRepo, userRepo);

      // User A (with custom override)
      const userAResult = await service.getMatrixForUser(String(userAId), "office_member");
      expect(userAResult.isCustom).toBe(true);
      expect(userAResult.matrix[MODULE_KEYS.NEWS_BLOG].delete).toBe(true);

      // User B (inheriting office_member role defaults)
      const userBResult = await service.getMatrixForUser(String(userBId), "office_member");
      expect(userBResult.isCustom).toBe(false);
      expect(userBResult.matrix[MODULE_KEYS.NEWS_BLOG].delete).toBe(false);
    });
  });

  describe("3. Privilege Escalation & Role Hierarchy Protection", () => {
    it("SEC-05: Prevents an actor from managing roles or users at or above their rank", () => {
      const superAdminLevel = 0;
      const adminLevel = 1;
      const staffLevel = 2;

      // SuperAdmin can manage everyone
      expect(canManageRole(superAdminLevel, adminLevel)).toBe(true);
      expect(canManageRole(superAdminLevel, staffLevel)).toBe(true);

      // Admin (level 1) can manage staff (level 2)
      expect(canManageRole(adminLevel, staffLevel)).toBe(true);

      // Admin (level 1) CANNOT manage another Admin (level 1) or SuperAdmin (level 0)
      expect(canManageRole(adminLevel, adminLevel)).toBe(false);
      expect(canManageRole(adminLevel, superAdminLevel)).toBe(false);

      // Staff (level 2) CANNOT manage any staff or higher
      expect(canManageRole(staffLevel, staffLevel)).toBe(false);
      expect(canManageRole(staffLevel, adminLevel)).toBe(false);
    });
  });

  describe("4. SuperAdmin Safety Valve Immunity", () => {
    it("SEC-06: SuperAdmin always gets full matrix and bypasses database row restrictions", async () => {
      const superAdminUserId = String(new Types.ObjectId());

      const permissionRepo = {
        findByUser: jest.fn().mockResolvedValue([]), // No DB rows needed
      } as unknown as PermissionRepository;
      const roleRepo = {} as RoleRepository;
      const userRepo = {} as UserRepository;

      const service = new PermissionService(permissionRepo, roleRepo, userRepo);
      const result = await service.getMatrixForUser(superAdminUserId, "super_admin");

      expect(result.isCustom).toBe(false);
      expect(result.matrix[MODULE_KEYS.NEWS_BLOG]).toEqual(fullAccessGrant());
      expect(result.matrix[MODULE_KEYS.USERS]).toEqual(fullAccessGrant());
      expect(result.matrix[MODULE_KEYS.ROLES_PERMISSIONS]).toEqual(fullAccessGrant());
    });
  });
});
