import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isBootstrapAdmin, isMusaffaEmail } from "@/lib/permissions";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/api/auth")) {
        return true;
      }
      return !!auth?.user;
    },
    signIn({ user }) {
      if (!user.email || !isMusaffaEmail(user.email)) {
        return "/login?error=AccessDenied";
      }
      return true;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as "ADMIN" | "EDITOR" | "VIEWER";
      }
      return session;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
      }
      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role;
      }
      return token;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      const { prisma } = await import("@/lib/db");
      const role = isBootstrapAdmin(user.email) ? "ADMIN" : undefined;
      if (role) {
        await prisma.user.updateMany({
          where: { email: user.email.toLowerCase() },
          data: { role: "ADMIN" },
        });
      }
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
