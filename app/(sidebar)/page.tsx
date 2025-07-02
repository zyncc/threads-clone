import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";
import Feed from "./_feed";
import { InfinitePostFeedSize } from "@/lib/constants";

export default async function Home() {
  const session = await getServerSession();
  if (!session) {
    return redirect("/signin");
  }

  const feed = await prisma.post.findMany({
    where: {
      userId: {
        not: session?.user.id,
      },
      user: {
        accountPrivacy: "public",
      },
    },
    take: InfinitePostFeedSize + 1,
    include: {
      likes: {
        where: {
          userId: session?.user.id,
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
          userId: session?.user.id,
        },
      },
      user: {
        include: {
          followers: {
            where: {
              followerId: session?.user.id,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-2">
      <Feed feed={feed} session={session} />
    </div>
  );
}
