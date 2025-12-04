import type { NextAuthOptions, Account } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import CoinbaseProvider from "./coinbase-provider";
import { refreshCoinbaseToken } from "./coinbase";

// Extend the session types to include Coinbase tokens
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    coinbase?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      connected: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    picture?: string;
    accessToken?: string;
    // Coinbase-specific tokens (stored separately from main auth)
    coinbaseAccessToken?: string;
    coinbaseRefreshToken?: string;
    coinbaseExpiresAt?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    // Coinbase OAuth provider for exchange connection
    CoinbaseProvider({
      clientId: process.env.COINBASE_CLIENT_ID ?? "",
      clientSecret: process.env.COINBASE_CLIENT_SECRET ?? "",
    }),
    // Email/Password provider (for demo - in production use a database)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In production, verify against your database
        // This is a demo implementation
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo: accept any email/password combination
        // Replace with actual database lookup in production
        return {
          id: "1",
          email: credentials.email,
          name: credentials.email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/", // Use custom sign-in modal instead of default page
  },
  callbacks: {
    async jwt({ token, user, account, profile }: { token: JWT; user?: { id: string; image?: string }; account?: Account | null; profile?: { picture?: string } }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      // Google profile includes the picture
      if (profile) {
        token.picture = profile.picture;
      }
      
      // Handle Coinbase OAuth tokens
      if (account?.provider === "coinbase") {
        // Store Coinbase tokens separately so they don't override main auth
        token.coinbaseAccessToken = account.access_token;
        token.coinbaseRefreshToken = account.refresh_token;
        token.coinbaseExpiresAt = account.expires_at 
          ? account.expires_at * 1000 
          : Date.now() + 7200 * 1000; // Default 2 hours
      }
      
      // Store access token for other providers
      if (account && account.provider !== "coinbase") {
        token.accessToken = account.access_token;
      }
      
      // Refresh Coinbase token if expired
      if (token.coinbaseAccessToken && token.coinbaseExpiresAt) {
        const shouldRefresh = Date.now() > (token.coinbaseExpiresAt - 60000); // Refresh 1 min before expiry
        
        if (shouldRefresh && token.coinbaseRefreshToken) {
          try {
            const refreshed = await refreshCoinbaseToken(token.coinbaseRefreshToken);
            token.coinbaseAccessToken = refreshed.access_token;
            token.coinbaseRefreshToken = refreshed.refresh_token;
            token.coinbaseExpiresAt = Date.now() + refreshed.expires_in * 1000;
          } catch (error) {
            console.error("Failed to refresh Coinbase token:", error);
            // Clear the tokens if refresh fails
            token.coinbaseAccessToken = undefined;
            token.coinbaseRefreshToken = undefined;
            token.coinbaseExpiresAt = undefined;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; image?: string }).id = token.id as string;
        // Pass the picture from token to session
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      
      // Add Coinbase connection status to session
      if (token.coinbaseAccessToken) {
        session.coinbase = {
          accessToken: token.coinbaseAccessToken,
          refreshToken: token.coinbaseRefreshToken || "",
          expiresAt: token.coinbaseExpiresAt || 0,
          connected: true,
        };
      }
      
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

