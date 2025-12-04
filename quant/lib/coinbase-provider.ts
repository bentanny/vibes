/**
 * Custom NextAuth Provider for Coinbase OAuth2
 * 
 * This creates a Coinbase OAuth provider that can be used with NextAuth
 * to authenticate users and get trading permissions.
 * 
 * Uses the new CDP (Coinbase Developer Platform) OAuth endpoints.
 */

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";
import { COINBASE_CONFIG } from "./coinbase";

export interface CoinbaseProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string;
  email?: string;
  time_zone?: string;
  native_currency?: string;
  country?: {
    code: string;
    name: string;
  };
}

export interface CoinbaseProviderOptions extends OAuthUserConfig<CoinbaseProfile> {
  /**
   * Additional scopes to request beyond the defaults
   */
  additionalScopes?: string[];
}

/**
 * Coinbase OAuth Provider for NextAuth (CDP - Coinbase Developer Platform)
 * 
 * Usage:
 * ```ts
 * import CoinbaseProvider from "@/lib/coinbase-provider";
 * 
 * export const authOptions = {
 *   providers: [
 *     CoinbaseProvider({
 *       clientId: process.env.COINBASE_CLIENT_ID!,
 *       clientSecret: process.env.COINBASE_CLIENT_SECRET!,
 *     }),
 *   ],
 * };
 * ```
 */
export default function CoinbaseProvider(
  options: CoinbaseProviderOptions
): OAuthConfig<CoinbaseProfile> {
  const scopes = [
    ...COINBASE_CONFIG.scopes,
    ...(options.additionalScopes || []),
  ];

  return {
    id: "coinbase",
    name: "Coinbase",
    type: "oauth",
    
    // CDP uses the new login.coinbase.com endpoints
    authorization: {
      url: COINBASE_CONFIG.authorizationUrl,
      params: {
        // Scopes are comma-separated for Coinbase (not space-separated)
        scope: scopes.join(","),
        response_type: "code",
      },
    },
    
    token: {
      url: COINBASE_CONFIG.tokenUrl,
    },
    
    userinfo: {
      url: `${COINBASE_CONFIG.apiBaseUrl}/user`,
      async request({ tokens }) {
        const response = await fetch(`${COINBASE_CONFIG.apiBaseUrl}/user`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "CB-VERSION": "2024-01-01",
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch Coinbase user info");
        }
        
        const { data } = await response.json();
        return data;
      },
    },
    
    profile(profile: CoinbaseProfile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email ?? null,
        image: profile.avatar_url,
      };
    },
    
    style: {
      logo: "https://www.coinbase.com/img/favicon/favicon-32x32.png",
      bg: "#0052FF",
      text: "#FFFFFF",
    },
    
    // Enable PKCE for enhanced security (recommended by Coinbase)
    checks: ["pkce", "state"],
    
    options,
  };
}

