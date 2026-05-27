import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth, type BetterAuthPlugin } from "better-auth";

export interface CreateAuthOptions {
  /** Drizzle database instance */
  db: Parameters<typeof drizzleAdapter>[0];
  /** Drizzle schema (optional, enables relational queries) */
  schema?: Record<string, unknown>;
  /** Additional better-auth plugins (e.g., sveltekitCookies) */
  plugins?: BetterAuthPlugin[];
}

export function createAuth({ db, schema, plugins = [] }: CreateAuthOptions) {
  return betterAuth({
    appName: "Sandfactory",
    baseURL:
      process.env.BETTER_AUTH_URL ??
      process.env.ORIGIN ??
      "http://localhost:5173",
    secret:
      process.env.BETTER_AUTH_SECRET ??
      "sandfactory-local-development-secret-123456789012",
    database: drizzleAdapter(db, {
      provider: "sqlite",
      ...(schema ? { schema } : {}),
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      minPasswordLength: 8,
    },
    disabledPaths: ["/sign-up/email"],
    plugins: [apiKey({ defaultPrefix: "sf" }), ...plugins],
  });
}
