import { type auth } from "@/auth";
import { AuthErrorResponse } from "@/lib/api-responses";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import sharp from "sharp";

export const user = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Update User Avatar
user.post("/avatar", async (c) => {
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
    `https://d2scaikh6ssfbt.cloudfront.net/avatars/${user?.id}.${extension}`,
  );
});

// Check if User has liked Post
user.get("/liked/:id", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");

  const likedPost = await prisma.user.findUnique({
    where: { id: user?.id as string },
    include: {
      Like: {
        select: {
          postId: true,
        },
        where: {
          postId: postId,
        },
      },
    },
  });

  const likeCount = likedPost?.Like.length;

  return c.json({ likedPost: !!likedPost?.Like.length, likeCount });
});

// Check if User is Following
user.get("/following/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const following = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      followers: {
        select: {
          followerId: true,
        },
        where: {
          followerId: user?.id as string,
        },
      },
    },
  });

  return c.json({
    following: !!following?.followers.length,
  });
});

user.get("/savedpost/:id", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");

  const savedPost = await prisma.user.findUnique({
    where: {
      id: user?.id as string,
    },
    include: {
      savedPost: {
        select: {
          postId: true,
        },
        where: {
          postId: postId,
        },
      },
    },
  });

  return c.json({
    savedPost: !!savedPost?.savedPost.length,
  });
});

// Follow User
user.post("/follow/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  if (!user) {
    return c.json(AuthErrorResponse(), 401);
  }

  await prisma.follow.create({
    data: {
      id: nanoid(12),
      followerId: user?.id,
      followingId: id,
    },
  });

  return c.json({
    status: 201,
    message: "User followed successfully",
  });
});

// Unfollow User
user.delete("/follow/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  if (!user) {
    return c.json(AuthErrorResponse(), 401);
  }

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: user?.id,
        followingId: id,
      },
    },
  });

  return c.json({
    status: 201,
    message: "User unfollowed successfully",
  });
});
