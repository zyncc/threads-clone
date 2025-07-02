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
import { commentSchema } from "@/lib/zod-schemas";
import {
  InfinitePostCommentsSize,
  InfinitePostFeedSize,
} from "@/lib/constants";

export const posts = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Create Post
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
        console.error("Invalid file type");
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

        //Sharp Image Processing
        const metadata = await sharp(arrayBuffer).metadata();
        const maxWidth = 1080;
        const maxHeight = 1350;

        let width = metadata.width!;
        let height = metadata.height!;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((maxWidth / width) * height);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((maxHeight / height) * width);
            height = maxHeight;
          }
        }

        const compressedImage = await sharp(arrayBuffer)
          .resize(width, height, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 80,
            progressive: true,
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

// Delete Post
posts.delete("/:id", async (c) => {
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

// Bookmark Post
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

// Unbookmark Post
posts.delete("/bookmark/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.savedPost.delete({
    where: {
      userId_postId: {
        userId: c.get("user")?.id as string,
        postId: id,
      },
    },
  });

  return c.json({
    status: 201,
    message: "Post unbookmarked successfully",
  });
});

// Create Comment
posts.post("/comment/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  console.log(id);
  const { comment }: { comment: string } = await c.req.json();

  const validate = commentSchema.safeParse({ comment, id });

  if (!validate.success) {
    return c.json(
      ErrorResponse({
        message: "Invalid comment",
        error: {
          code: 400,
          type: "Invalid comment",
        },
      }),
      400,
    );
  }

  await prisma.comment.create({
    data: {
      id: nanoid(12),
      content: comment,
      userId: user?.id as string,
      postId: id,
    },
  });

  await prisma.post.update({
    data: {
      commentCount: {
        increment: 1,
      },
    },
    where: {
      id,
    },
  });

  return c.json({
    status: 201,
    message: "Comment added successfully",
  });
});

// Delete Comment
posts.delete("/comment/:id", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");
  const commentId = c.req.query("commentId");

  // Authentication
  if (!user) {
    return c.json(AuthErrorResponse(), 401);
  }

  // Authorization
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId as string,
    },
  });

  if (!comment || comment.userId !== user?.id) {
    return c.json(
      ErrorResponse({
        message: "Comment not found or not authorized",
        error: {
          code: 403,
          type: "Comment not found or not authorized",
        },
      }),
      403,
    );
  }

  await prisma.comment.delete({
    where: {
      id: commentId as string,
    },
  });

  await prisma.post.update({
    data: {
      commentCount: {
        decrement: 1,
      },
    },
    where: {
      id: postId,
    },
  });

  return c.json({
    status: 201,
    message: "Comment added successfully",
  });
});

// Fetch Infinite Post Comments
posts.get("/comments/:id", async (c) => {
  const id = c.req.param("id");
  const cursor = c.req.query("cursor") || undefined;

  const comments = await prisma.comment.findMany({
    where: {
      postId: id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
    take: InfinitePostCommentsSize + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  const nextCursor =
    comments.length > InfinitePostCommentsSize
      ? comments[InfinitePostCommentsSize].id
      : null;

  return c.json({
    comments: comments.slice(0, InfinitePostCommentsSize),
    nextCursor,
  });
});

// Infinite Following Feed
posts.get("/following-feed", async (c) => {
  const cursor = c.req.query("cursor") || undefined;
  const user = c.get("user");

  const feed = await prisma.post.findMany({
    where: {
      user: {
        followers: {
          some: {
            followerId: user?.id,
          },
        },
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    take: InfinitePostFeedSize + 1,
    include: {
      likes: {
        where: {
          userId: user?.id,
        },
        select: {
          userId: true,
        },
      },
      savedBy: {
        select: {
          userId: true,
        },
        where: {
          userId: user?.id,
        },
      },
      user: {
        include: {
          followers: {
            where: {
              followerId: user?.id,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const nextCursor =
    feed.length > InfinitePostFeedSize ? feed[InfinitePostFeedSize].id : null;

  return c.json({ feed: feed.slice(0, InfinitePostFeedSize), nextCursor });
});

// Infinite Account Feed
posts.get("/account-feed", async (c) => {
  const cursor = c.req.query("cursor") || undefined;
  const user = c.get("user");

  const feed = await prisma.post.findMany({
    where: {
      user: {
        accountPrivacy: "public",
        username: user?.username as string,
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    take: InfinitePostFeedSize + 1,
    skip: 1,
    include: {
      likes: {
        where: {
          userId: user?.id,
        },
        select: {
          userId: true,
        },
      },
      savedBy: {
        select: {
          userId: true,
        },
        where: {
          userId: user?.id,
        },
      },
      user: {
        include: {
          followers: {
            where: {
              followerId: user?.id,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const nextCursor =
    feed.length > InfinitePostFeedSize ? feed[InfinitePostFeedSize].id : null;

  return c.json({ feed: feed.slice(0, InfinitePostFeedSize), nextCursor });
});

// Infinite Account Saved Feed
posts.get("/saved-feed", async (c) => {
  const cursor = c.req.query("cursor") || undefined;
  const user = c.get("user");

  const feed = await prisma.post.findMany({
    where: {
      savedBy: {
        some: {
          userId: user?.id,
        },
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    take: InfinitePostFeedSize + 1,
    include: {
      likes: {
        where: {
          userId: user?.id,
        },
        select: {
          userId: true,
        },
      },
      savedBy: {
        select: {
          userId: true,
        },
        where: {
          userId: user?.id,
        },
      },
      user: {
        include: {
          followers: {
            where: {
              followerId: user?.id,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const nextCursor =
    feed.length > InfinitePostFeedSize ? feed[InfinitePostFeedSize].id : null;

  return c.json({ feed: feed.slice(0, InfinitePostFeedSize), nextCursor });
});

// Infinite For You Feed
posts.get("/for-you-feed", async (c) => {
  const cursor = c.req.query("cursor") || undefined;
  const user = c.get("user");

  const feed = await prisma.post.findMany({
    where: {
      userId: {
        not: user?.id,
      },
      user: {
        accountPrivacy: "public",
      },
    },
    cursor: cursor ? { id: cursor } : undefined,
    take: InfinitePostFeedSize + 1,
    skip: 1,
    include: {
      likes: {
        where: {
          userId: user?.id,
        },
        select: {
          userId: true,
        },
      },
      savedBy: {
        select: {
          userId: true,
        },
        where: {
          userId: user?.id,
        },
      },
      user: {
        include: {
          followers: {
            where: {
              followerId: user?.id,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const nextCursor =
    feed.length > InfinitePostFeedSize ? feed[InfinitePostFeedSize].id : null;

  return c.json({ feed: feed.slice(0, InfinitePostFeedSize), nextCursor });
});

// Like Post
posts.post("/like/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [post, like] = await Promise.allSettled([
    prisma.post.update({
      where: {
        id,
      },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    }),
    prisma.like.create({
      data: {
        id: nanoid(12),
        userId: user?.id as string,
        postId: id,
      },
    }),
  ]);

  if (post.status === "fulfilled" && like.status === "fulfilled") {
    return c.json({
      status: 201,
      message: "Post liked successfully",
    });
  }
});

// Dislike Post
posts.delete("/like/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [post, like] = await Promise.allSettled([
    prisma.post.update({
      where: {
        id,
      },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    }),
    prisma.like.delete({
      where: {
        userId_postId: {
          postId: id,
          userId: user?.id as string,
        },
      },
    }),
  ]);

  if (post.status === "fulfilled" && like.status === "fulfilled") {
    return c.json({
      status: 201,
      message: "Post disliked successfully",
    });
  }
});

// Unlike Post
posts.delete("/like/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [post, like] = await Promise.allSettled([
    prisma.post.update({
      where: {
        id,
      },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    }),
    prisma.like.delete({
      where: {
        userId_postId: {
          userId: user?.id as string,
          postId: id,
        },
      },
    }),
  ]);

  if (post.status === "fulfilled" && like.status === "fulfilled") {
    revalidatePath(`/@${user?.username}`, "page");
    revalidatePath("/", "page");
    return c.json({
      status: 201,
      message: "Post liked successfully",
    });
  }
});
