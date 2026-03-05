import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";

interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  department?: string | null;
  mustChangePassword: boolean;
}

declare module "next-auth" {
  interface User extends ExtendedUser {}
  interface Session {
    user?: ExtendedUser;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
        } catch (error) {
          // Avoid leaking internal DB connection details to end users.
          console.error("Authentication database error:", error);
          throw new Error("Authentication service is temporarily unavailable");
        }

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact your supervisor for assistance.");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          mustChangePassword: user.mustChangePassword
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('NextAuth JWT callback - User data:', {
          id: user.id,
          email: user.email, 
          role: user.role,
          mustChangePassword: user.mustChangePassword
        });
        
        token.role = user.role;
        token.department = user.department;
        
        // Explicitly set mustChangePassword as a boolean
        token.mustChangePassword = user.mustChangePassword === true;
        
        console.log('NextAuth JWT callback - Token data after update:', {
          role: token.role,
          mustChangePassword: token.mustChangePassword
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "USER" | "ADMIN" | "SUPER_ADMIN";
        session.user.department = token.department as string | null;
        
        // Explicitly set mustChangePassword as boolean with a definite value
        session.user.mustChangePassword = token.mustChangePassword === true;
        
        console.log('NextAuth Session Callback - mustChangePassword:', session.user.mustChangePassword);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('NextAuth redirect callback - URL:', url);
      console.log('NextAuth redirect callback - Base URL:', baseUrl);

      // Allow only same-origin absolute URLs.
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Allow relative URLs.
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Fallback to home for unknown origins.
      return baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signin"
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
