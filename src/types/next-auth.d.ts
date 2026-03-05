import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      role?: "USER" | "ADMIN" | "ORG_ADMIN" | "SUPER_ADMIN";
      orgRole?: "ORG_ADMIN" | "ADMIN" | "USER";
      mustChangePassword?: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    role?: "USER" | "ADMIN" | "ORG_ADMIN" | "SUPER_ADMIN";
    orgRole?: "ORG_ADMIN" | "ADMIN" | "USER";
    mustChangePassword?: boolean;
  }

  interface JWT {
    role?: "USER" | "ADMIN" | "ORG_ADMIN" | "SUPER_ADMIN";
    orgRole?: "ORG_ADMIN" | "ADMIN" | "USER";
    id?: string;
    mustChangePassword?: boolean;
  }
}
