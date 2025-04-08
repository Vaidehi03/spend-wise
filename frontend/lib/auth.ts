import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// This is a simplified auth configuration that works in the browser environment
export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // For demo purposes, accept any email/password combination
        if (credentials?.email && credentials?.password) {
          return {
            id: "1",
            name: "Demo User",
            email: credentials.email,
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: "your-secret-key", // In production, use a proper secret from environment variables
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig)

