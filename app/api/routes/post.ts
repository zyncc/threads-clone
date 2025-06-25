import { nanoid } from "nanoid";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import validateFiles from "@/lib/file-validation";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Hono } from "hono";
import { type auth } from "@/auth";
import {
  AuthErrorResponse,
  ErrorResponse,
  SuccessResponse,
} from "@/lib/api-responses";

export const posts = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

posts.post("/", async (c) => {
  try {
    const data = await c.req.formData();
    const images = data.getAll("files") as File[];
    const description = data.get("description");
    const user = c.get("user");
    const imageUrls: string[] = [];

    if (!user) {
      return c.json(AuthErrorResponse(), 401);
    }

    if (images.length > 0) {
      const check = validateFiles(images);

      if (!check?.success) {
        return c.json(
          ErrorResponse({
            message: "Invalid file type",
            error: {
              code: 400,
              type: "Invalid file type",
            },
          }),
          400,
        );
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
          `https://d2scaikh6ssfbt.cloudfront.net/posts/${fileNameWithExtension}`,
        );
      }
    }

    const postId = await prisma.post.create({
      data: {
        id: nanoid(12),
        images: imageUrls,
        description: description as string,
        userId: user?.id as string,
      },
    });

    revalidatePath(`/@${user?.username}`);
    return c.json(
      SuccessResponse({
        message: "Post created successfully",
        data: {
          id: postId.id,
        },
      }),
      201,
    );
  } catch (error) {
    console.log(error);
    return c.json(
      ErrorResponse({
        message: "Failed to create post",
        error: {
          code: 500,
          type: error as string,
        },
      }),
      500,
    );
  }
});

posts.post("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");

    if (!user) {
      return c.json(AuthErrorResponse(), 401);
    }

    if (!id) {
      return c.json(ErrorResponse({ message: "Post ID is required" }), 400);
    }

    const postToDelete = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!postToDelete || postToDelete.userId !== user?.id) {
      return c.json(
        ErrorResponse({
          message: "Post not found or not authorized",
          error: {
            code: 403,
            type: "Post not found or not authorized",
          },
        }),
        403,
      );
    }

    await prisma.post.delete({
      where: {
        id,
      },
    });

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
    revalidatePath(`/@${c.get("user")?.username}`);
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
  }
});

posts.post("/bookmark/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await prisma.savedPost.create({
    data: {
      id: nanoid(12),
      userId: user?.id,
      postId: id,
    },
  });

  return c.json({
    status: 201,
    message: "Post bookmarked successfully",
  });
});

posts.delete("/bookmark/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.savedPost.delete({
    where: {
      id,
    },
  });

  return c.json({
    status: 201,
    message: "Post unbookmarked successfully",
  });
});

posts.post("/comment/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { comment }: { comment: string } = await c.req.json();

  await prisma.comment.create({
    data: {
      id: nanoid(12),
      content: comment,
      userId: user?.id,
      postId: id,
    },
  });
  return c.json({
    status: 201,
    message: "Comment added successfully",
  });
});

posts.post("/like/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await prisma.post.update({
    where: {
      id,
    },
    data: {
      likeCount: {
        increment: 1,
      },
    },
  });

  await prisma.like.create({
    data: {
      id: nanoid(12),
      userId: user?.id as string,
      postId: id,
    },
  });
});
