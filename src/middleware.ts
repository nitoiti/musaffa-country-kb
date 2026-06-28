import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/** Edge-safe middleware — no Prisma adapter */
export default NextAuth({
  ...authConfig,
  providers: [],
  secret: process.env.AUTH_SECRET,
}).auth;

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
