import { auth } from "@/auth";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";

export const runtime = "nodejs";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>().basePath("/api");

app.use(logger());
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

export const GET = handle(app);
export const POST = handle(app);
