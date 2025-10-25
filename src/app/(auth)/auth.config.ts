import Credentials from "next-auth/providers/credentials";
import { fetchWithErrorHandlers } from "@/lib/utils";
import type { NextAuthOptions } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password } = credentials;

        try {
          const response = await fetchWithErrorHandlers(
            `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            }
          );

          if (!response.ok) {
            return null;
          }

          const user = await response.json();

          // Decode the JWT token to extract user information
          const decodedToken = JSON.parse(
            Buffer.from(user.token.split(".")[1], "base64").toString()
          );

          return {
            id: decodedToken.userId,
            email: decodedToken.email,
            name: decodedToken.name,
            type: "regular",
          };
        } catch (error) {
          console.error("Login failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.name = token.name;
      session.user.email = token.email;
      return session;
    },
  },
} satisfies NextAuthOptions;
