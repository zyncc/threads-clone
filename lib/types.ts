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
