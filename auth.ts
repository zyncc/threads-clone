import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import * as schema from "@/db/schema";
import { username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import db from "./lib/db";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  logger: {
    disabled: false,
    level: "error",
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 31, // 31 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [username(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
