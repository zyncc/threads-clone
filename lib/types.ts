import { type Prisma } from "@prisma/client";

export type CommentWithUser = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
        username: true;
      };
    };
  };
}>;

export type Feed = Prisma.PostGetPayload<{
  include: {
    likes: {
      select: {
        userId: true;
      };
    };
    savedBy: {
      select: {
        userId: true;
      };
    };
    user: {
      include: {
        followers: true;
      };
    };
  };
}>;

export type AccountFeed = Prisma.UserGetPayload<{
  include: {
    Post: {
      include: {
        likes: {
          select: {
            userId: true,
          },
        },
        savedBy: {
          select: {
            userId: true,
          },
        },
        user: {
          include: {
            followers: true
          },
        },
      },
    },
  },
}>
