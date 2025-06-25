import Post from "@/components/ui/post";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";

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
    take: 20,
    include: {
      savedBy: {
        select: {
          userId: true,
          id: true,
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
      comments: {
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
        take: 20,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-2">
      <div className="my-10 flex flex-col gap-5">
        {feed.map((post) => (
          <Post
            key={post.id}
            user={post.user}
            post={post}
            comments={post.comments}
            savedPost={{
              saved: post.savedBy[0]?.userId === session?.user.id,
              id: post.savedBy[0]?.id,
            }}
            following={post.user.followers[0]?.followerId === session?.user.id}
            ownPost={post.userId === session?.user.id}
          />
        ))}
      </div>
    </div>
  );
}
