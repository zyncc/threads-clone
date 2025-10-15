import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-server-session";
import { InfinitePostFeedSize } from "@/lib/constants";
import AccountFeed from "./_accountfeed";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    return redirect("/signin");
  }

  const encodedUsername = (await params).username;
  const decoded = decodeURIComponent(encodedUsername);
  const username = decoded.startsWith("@") ? decoded.slice(1) : decoded;

  const feed = await prisma.user.findUnique({
    where: {
      username,
    },
    include: {
      Post: {
        include: {
          likes: {
            where: {
              userId: session.user.id,
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
              userId: session.user.id,
            },
          },
          user: {
            include: {
              followers: {
                where: {
                  followerId: session.user.id,
                },
              },
            },
          },
        },
        where: {
          user: {
            username,
          },
        },
      },
    },
  });

  if (!feed) {
    return notFound();
  }

  return <AccountFeed feed={feed} username={username} session={session} />;
}
