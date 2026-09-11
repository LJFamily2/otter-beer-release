import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authService } from "@/services/AuthService";
import {
  permissionService,
  type PermissionMatrix,
} from "@/services/PermissionService";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    // Rendered later on the frontend pass; NextAuth falls back to its
    // built-in page until then.
    signIn: "/admin/dang-nhap",
    error: "/admin/dang-nhap",
  },
  // Explicit even though these are NextAuth's defaults — docs/security.md
  // requires httpOnly session cookies as a hard rule, not an assumption.
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const decision = await authService.handleSignIn({
        email: profile.email,
        name: profile.name ?? profile.email,
        image: typeof profile.picture === "string" ? profile.picture : undefined,
      });
      return decision.allowed;
    },

    // Re-resolves the user's role from the DB on every call (cheap, indexed
    // lookup) rather than trusting a cached JWT claim, so a role change or
    // `isActive: false` revocation takes effect on the user's next request
    // instead of only after their session cookie expires.
    async jwt({ token }) {
      if (!token.email) return token;

      const resolved = await authService.getUserWithRoleKey(token.email);
      if (!resolved || !resolved.user.isActive) {
        token.userId = undefined;
        token.roleKey = undefined;
        token.roleLevel = undefined;
        return token;
      }

      token.userId = String(resolved.user._id);
      token.roleKey = resolved.roleKey;
      token.roleLevel = resolved.roleLevel;
      return token;
    },

    async session({ session, token }) {
      // next-auth@beta's `session` callback param type resolves the
      // augmented JWT fields as `{}` here (unlike the `jwt` callback above,
      // where the same augmentation resolves correctly) — a known type
      // inference quirk in this beta version, not a runtime issue. The
      // casts below are safe: both fields are set as plain strings (or left
      // undefined) in the `jwt` callback right above.
      const userId = token.userId as string | undefined;
      const roleKey = token.roleKey as string | undefined;
      const roleLevel = token.roleLevel as number | undefined;

      if (!userId || !roleKey || roleLevel === undefined) {
        // Revoked/unknown user — strip identifying fields so downstream
        // guards (RouteGuard, proxy.ts) treat this as unauthenticated.
        session.user.id = "";
        session.user.roleKey = "";
        session.user.roleLevel = Number.MAX_SAFE_INTEGER;
        session.user.permissions = {} as PermissionMatrix;
        return session;
      }

      const { matrix } = await permissionService.getMatrixForUser(userId, roleKey);
      session.user.id = userId;
      session.user.roleKey = roleKey;
      session.user.roleLevel = roleLevel;
      session.user.permissions = matrix;
      return session;
    },
  },
});
