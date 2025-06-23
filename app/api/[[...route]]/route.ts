import { auth } from "@/auth";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import db from "@/lib/db";
import { likes, post, savedPosts } from "@/db/schema";
import { nanoid } from "nanoid";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import validateFiles from "@/lib/file-validation";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
        const targetWidth = 1200;
        const targetHeight = Math.round((3 / 4) * targetWidth);
        const compressedImage = await sharp(arrayBuffer)
          .resize(targetWidth, targetHeight, {
            fit: "cover",
            position: "center",
          })
          .jpeg({
            quality: 80,
            mozjpeg: true,
          })
          .toBuffer();
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `posts/${fileNameWithExtension}`,
          Body: compressedImage,
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
    revalidatePath("/@zync");
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
  } finally {
    revalidatePath("/@zync");
  }
});

app.post("/post/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");

    if (!id) {
      return c.json({
        status: 400,
        message: "Post ID is required",
      });
    }

    console.log(id);

    const postToDelete = await db.query.post.findFirst({
      where: (post, { eq }) => eq(post.id, id),
    });

    if (!postToDelete || postToDelete.userId !== user?.id) {
      throw new Error("Post not found or not authorized");
    }

    await db.delete(post).where(eq(post.id, id));

    if (postToDelete.images && postToDelete.images.length > 0) {
      const s3 = new S3Client({
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        region: process.env.S3_REGION!,
      });
      for (const image of postToDelete.images) {
        const key = image.split("posts/")[1];
        const command = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `posts/${key}`,
        });
        await s3.send(command);
      }
    }
    return c.json({
      status: 204,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    c.status(500);
    return c.json({
      status: 500,
      message: "Failed to delete post",
    });
  } finally {
    revalidatePath(`/@${c.get("user")?.username}`);
  }
});

app.post("/user-avatar", async (c) => {
  type Area = { x: number; y: number; width: number; height: number };
  const formData = await c.req.formData();
  const avatar = formData.get("avatar") as File;
  const crop = formData.get("crop") as string;
  const user = c.get("user");
  const extension = avatar.name.split(".").pop()?.toLowerCase();

  const cropData: Area = JSON.parse(crop);
  const buffer = await avatar.arrayBuffer();
  const finalImage = await sharp(buffer)
    .extract({
      left: cropData.x,
      top: cropData.y,
      width: cropData.width,
      height: cropData.height,
    })
    .toBuffer();

  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    region: process.env.S3_REGION!,
  });
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: `avatars/${user?.id}.${extension}`,
    Body: finalImage,
  });
  await s3.send(command);
  return c.text(
    `https://dz659x1g35zt2.cloudfront.net/avatars/${user?.id}.${extension}`,
  );
});

app.post("/bookmark", async (c) => {
  const user = c.get("user");
  const { postId }: { postId: string } = await c.req.json();
  await db.insert(savedPosts).values({
    id: nanoid(12),
    userId: user?.id,
    postId,
  });
  return c.json({
    status: 201,
    message: "Post bookmarked successfully",
  });
});

app.post("/like", async (c) => {
  const user = c.get("user");
  const { postId }: { postId: string } = await c.req.json();
  const getCurrentLikes = await db.query.likes.findFirst({
    where: (likes, { eq }) => eq(likes.postId, postId),
    columns: {
      likes: true,
    },
  });
  await db.insert(likes).values({
    id: nanoid(12),
    userId: user?.id as string,
    likes: getCurrentLikes?.likes ?? 0 + 1,
    postId,
  });
});

export const GET = handle(app);
export const POST = handle(app);
