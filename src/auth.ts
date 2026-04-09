import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
            role: true,
            clientId: true,
            agencyId: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as UserRole,
          clientId: user.clientId,
          agencyId: user.agencyId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clientId = user.clientId ?? null;
        token.agencyId = user.agencyId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as UserRole;
      session.user.clientId = (token.clientId ?? null) as string | null;
      session.user.agencyId = (token.agencyId ?? null) as string | null;
      return session;
    },
  },
});
