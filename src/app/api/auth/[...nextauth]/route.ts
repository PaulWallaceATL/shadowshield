import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import { validateAuthEnv } from "@/lib/env";

validateAuthEnv();

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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

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
      
      // Handle sign in redirects
      if (url.startsWith(baseUrl)) {
        try {
          // Get the user's token to check their role
          const token = await prisma.session.findFirst({
            orderBy: { expires: 'desc' },
            include: { user: true },
          });

          console.log('NextAuth redirect - User mustChangePassword:', token?.user?.mustChangePassword);

          if (token?.user) {
            // First check if user must change password - this must take priority!
            if (token.user.mustChangePassword === true) {
              console.log('User must change password, forcing redirect to change-password');
              return `${baseUrl}/auth/change-password`;
            }
            
            // Otherwise redirect based on role
            if (token.user.role === 'USER') {
              return `${baseUrl}/chat`;
            } else if (['ADMIN', 'SUPER_ADMIN'].includes(token.user.role)) {
              return `${baseUrl}/admin`;
            }
          }
        } catch (error) {
          console.error('Error in NextAuth redirect callback:', error);
        }
      }
      return url;
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
