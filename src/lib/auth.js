import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Optional: enforce hosted domain directly on the provider level
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        if (profile.email && profile.email.endsWith("@ashoka.edu.in")) {
          return true;
        }
        return false; // Deny sign in for non-ashoka emails
      }
      return true;
    },
    async session({ session, token }) {
      session.user.id = token.sub; // Inject user id into session
      return session;
    }
  },
  session: {
    strategy: "jwt" // Use secure HTTP only JWE tokens
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/" // We use our own customized landing page as the sign in
  }
};
