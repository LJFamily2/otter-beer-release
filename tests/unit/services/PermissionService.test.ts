/**
 * @jest-environment node
 *
 * Comprehensive unit tests for PermissionService & PermissionRepository in the Hybrid Permission Model.
 */
import { Types } from "mongoose";
import { PermissionModel } from "@/models/Permission";
import { PermissionService } from "@/services/PermissionService";
import { PermissionRepository } from "@/repositories/PermissionRepository";
import { RoleRepository } from "@/repositories/RoleRepository";
import { UserRepository } from "@/repositories/UserRepository";
import { fullAccessGrant } from "@/config/permissions";

function assertNoRawCycle(value: unknown): void {
  const seen = new Set<unknown>();
  function walk(node: unknown, depth: number): void {
    if (depth > 100) throw new Error("depth exceeded 100 — cyclic or too deep");
    if (node === null || typeof node !== "object") return;
    if (seen.has(node)) throw new Error("cycle detected");
    seen.add(node);
    for (const key of Object.keys(node as object)) {
      walk((node as Record<string, unknown>)[key], depth + 1);
    }
    seen.delete(node);
  }
  walk(value, 0);
}

describe("PermissionService (Hybrid Permission Model)", () => {
  let permissionRepository: PermissionRepository;
  let roleRepository: RoleRepository;
  let userRepository: UserRepository;
  let service: PermissionService;

  beforeEach(() => {
    permissionRepository = {
      findByUser: jest.fn(),
      findByRole: jest.fn(),
      upsertRoleGrant: jest.fn(),
      upsertUserGrant: jest.fn(),
      deleteByUser: jest.fn(),
      deleteByRole: jest.fn(),
    } as unknown as PermissionRepository;

    roleRepository = {
      findById: jest.fn(),
      findByKey: jest.fn(),
    } as unknown as RoleRepository;

    userRepository = {
      findByIdWithRole: jest.fn(),
    } as unknown as UserRepository;

    service = new PermissionService(
      permissionRepository,
      roleRepository,
      userRepository
    );
  });

  describe("getMatrixForUser", () => {
    it("returns user custom matrix with isCustom: true when overrides exist", async () => {
      const userId = new Types.ObjectId();
      const row = new PermissionModel({
        userId,
        moduleKey: "news_blog",
        actions: { access: true, view: true, add: false, edit: false, delete: false },
      });

      (permissionRepository.findByUser as jest.Mock).mockResolvedValue([row]);

      const result = await service.getMatrixForUser(String(userId), "office_member");

      expect(() => assertNoRawCycle(result.matrix)).not.toThrow();
      expect(result.isCustom).toBe(true);
      expect(result.matrix.news_blog.access).toBe(true);
    });

    it("falls back to role default matrix with isCustom: false when no user overrides exist", async () => {
      const userId = new Types.ObjectId();
      const roleId = new Types.ObjectId();
      const roleRow = new PermissionModel({
        roleId,
        moduleKey: "news_blog",
        actions: { access: true, view: true, add: true, edit: true, delete: false },
      });

      (permissionRepository.findByUser as jest.Mock).mockResolvedValue([]);
      (roleRepository.findByKey as jest.Mock).mockResolvedValue({
        _id: roleId,
        key: "office_member",
      });
      (permissionRepository.findByRole as jest.Mock).mockResolvedValue([roleRow]);

      const result = await service.getMatrixForUser(String(userId), "office_member");

      expect(result.isCustom).toBe(false);
      expect(result.matrix.news_blog.add).toBe(true);
    });

    it("always returns full matrix for super_admin role regardless of stored rows", async () => {
      const userId = new Types.ObjectId();
      const result = await service.getMatrixForUser(String(userId), "super_admin");

      expect(result.isCustom).toBe(false);
      expect(result.matrix.news_blog).toEqual(fullAccessGrant());
      expect(result.matrix.users).toEqual(fullAccessGrant());
    });
  });

  describe("setMatrixForUser", () => {
    it("allows a senior actor to set custom per-user overrides", async () => {
      const userId = String(new Types.ObjectId());
      const roleId = new Types.ObjectId();

      (userRepository.findByIdWithRole as jest.Mock).mockResolvedValue({
        _id: userId,
        roleId: { _id: roleId, key: "office_member", level: 2 },
      });
      (permissionRepository.upsertUserGrant as jest.Mock).mockResolvedValue({});
      (permissionRepository.findByUser as jest.Mock).mockResolvedValue([
        new PermissionModel({
          userId: new Types.ObjectId(userId),
          moduleKey: "news_blog",
          actions: fullAccessGrant(),
        }),
      ]);

      const actorLevel = 0; // superAdmin rank
      const result = await service.setMatrixForUser(
        userId,
        [{ moduleKey: "news_blog", actions: fullAccessGrant() }],
        actorLevel
      );

      expect(permissionRepository.upsertUserGrant).toHaveBeenCalledWith(
        userId,
        "news_blog",
        fullAccessGrant()
      );
      expect(result.isCustom).toBe(true);
    });

    it("prevents setting permissions on a super_admin user", async () => {
      const userId = String(new Types.ObjectId());
      (userRepository.findByIdWithRole as jest.Mock).mockResolvedValue({
        _id: userId,
        roleId: { key: "super_admin", level: 0 },
      });

      await expect(
        service.setMatrixForUser(
          userId,
          [{ moduleKey: "news_blog", actions: fullAccessGrant() }],
          0
        )
      ).rejects.toThrow("superAdmin always has full access and cannot be edited.");
    });

    it("prevents an actor from setting permissions for a peer or superior user", async () => {
      const userId = String(new Types.ObjectId());
      (userRepository.findByIdWithRole as jest.Mock).mockResolvedValue({
        _id: userId,
        roleId: { key: "admin", level: 1 },
      });

      const actorLevel = 1; // Peer admin trying to edit another admin's perms
      await expect(
        service.setMatrixForUser(
          userId,
          [{ moduleKey: "news_blog", actions: fullAccessGrant() }],
          actorLevel
        )
      ).rejects.toThrow("You cannot manage permissions for a user whose role is at or above your own rank.");
    });
  });

  describe("setMatrixForRole", () => {
    it("allows a senior actor to set baseline role default permissions", async () => {
      const roleId = String(new Types.ObjectId());
      (roleRepository.findById as jest.Mock).mockResolvedValue({
        _id: roleId,
        key: "office_member",
        level: 2,
      });
      (permissionRepository.upsertRoleGrant as jest.Mock).mockResolvedValue({});
      (permissionRepository.findByRole as jest.Mock).mockResolvedValue([
        new PermissionModel({
          roleId: new Types.ObjectId(roleId),
          moduleKey: "news_blog",
          actions: fullAccessGrant(),
        }),
      ]);

      const actorLevel = 1; // Admin level editing office_member (level 2)
      const matrix = await service.setMatrixForRole(
        roleId,
        [{ moduleKey: "news_blog", actions: fullAccessGrant() }],
        actorLevel
      );

      expect(permissionRepository.upsertRoleGrant).toHaveBeenCalledWith(
        roleId,
        "news_blog",
        fullAccessGrant()
      );
      expect(matrix.news_blog).toEqual(fullAccessGrant());
    });

    it("prevents setting permissions on super_admin role", async () => {
      const roleId = String(new Types.ObjectId());
      (roleRepository.findById as jest.Mock).mockResolvedValue({
        _id: roleId,
        key: "super_admin",
        level: 0,
      });

      await expect(
        service.setMatrixForRole(
          roleId,
          [{ moduleKey: "news_blog", actions: fullAccessGrant() }],
          0
        )
      ).rejects.toThrow("superAdmin always has full access and cannot be edited.");
    });
  });

  describe("resetUserToRoleDefaults", () => {
    it("deletes user custom override rows and reverts to role baseline defaults", async () => {
      const userId = String(new Types.ObjectId());
      const roleId = new Types.ObjectId();

      (userRepository.findByIdWithRole as jest.Mock).mockResolvedValue({
        _id: userId,
        roleId: { _id: roleId, key: "office_member", level: 2 },
      });
      (permissionRepository.deleteByUser as jest.Mock).mockResolvedValue(undefined);
      (permissionRepository.findByUser as jest.Mock).mockResolvedValue([]);
      (roleRepository.findByKey as jest.Mock).mockResolvedValue({
        _id: roleId,
        key: "office_member",
      });
      (permissionRepository.findByRole as jest.Mock).mockResolvedValue([
        new PermissionModel({
          roleId,
          moduleKey: "news_blog",
          actions: { access: true, view: true, add: false, edit: false, delete: false },
        }),
      ]);

      const result = await service.resetUserToRoleDefaults(userId, 0);

      expect(permissionRepository.deleteByUser).toHaveBeenCalledWith(userId);
      expect(result.isCustom).toBe(false);
      expect(result.matrix.news_blog.access).toBe(true);
    });
  });
});
