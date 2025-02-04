import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/error";

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        username: token.username as string,
        role: token.role as "ADMIN" | "MODERATOR" | "TECHNICIAN",
      };
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("Missing credentials");
          }

          // Supabase query
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", credentials.username)
            .maybeSingle();

          if (error) throw new Error(error.message);
          if (!user) throw new Error("Invalid credentials");

          // Password validation
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) throw new Error("Invalid credentials");

          return {
            id: user.id,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", getErrorMessage(error));
          return null;
        }
      },
    }),
  ],
});

export { handler as GET, handler as POST };
