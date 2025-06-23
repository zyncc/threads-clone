import { auth } from "@/auth";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import db from "@/lib/db";
import { post } from "@/db/schema";
import { nanoid } from "nanoid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import validateFiles from "@/lib/file-validation";

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

app.post("/post", async (c) => {
  try {
    const data = await c.req.formData();
    const images = data.getAll("files") as File[];
    const description = data.get("description");
    const user = c.get("user");
    const imageUrls: string[] = [];

    if (images.length > 0) {
      const check = validateFiles(images);

      if (!check?.success) {
        return c.json({ error: check?.error }, 400);
      }
      const s3 = new S3Client({
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        region: process.env.S3_REGION!,
      });

      for (const image of images) {
        const extension = image.name.split(".").pop()?.toLowerCase();
        const uniqueName = `${user?.id}_${nanoid(12)}`;
        const fileNameWithExtension = `${uniqueName}.${extension}`;
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `posts/${fileNameWithExtension}`,
          Body: buffer,
        });
        await s3.send(command);
        imageUrls.push(
          `https://dz659x1g35zt2.cloudfront.net/posts/${fileNameWithExtension}`,
        );
      }
    }

    await db.insert(post).values({
      id: nanoid(12),
      images: imageUrls,
      description: description as string,
      userId: user?.id as string,
    });

    c.status(201);
    return c.json({
      status: 201,
      message: "Post created successfully",
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({
      status: 500,
      message: "Failed to create post",
    });
  }
});

export const GET = handle(app);
export const POST = handle(app);
