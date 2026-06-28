import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { isBootstrapAdmin } from "@/lib/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (dbUser) {
          token.role = dbUser.role;
        } else if (isBootstrapAdmin(user.email)) {
          token.role = "ADMIN";
        } else {
          token.role = "VIEWER";
        }
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
        });
        if (dbUser) token.role = dbUser.role;
      }
      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role =
          (token.role as "ADMIN" | "EDITOR" | "VIEWER") ?? "VIEWER";
      }
      return session;
    },
    signIn: authConfig.callbacks?.signIn,
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      const role = isBootstrapAdmin(user.email) ? "ADMIN" : undefined;
      if (role) {
        await prisma.user.updateMany({
          where: { email: user.email.toLowerCase() },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});
