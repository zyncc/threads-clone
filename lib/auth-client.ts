import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [usernameClient(), nextCookies()],
});
