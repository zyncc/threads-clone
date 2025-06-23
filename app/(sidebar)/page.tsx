import Post from "@/components/ui/post";
import db from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";

export default async function Home() {
  const session = await getServerSession();
  const feed = await db.query.post.findMany({
    with: {
      user: {
        with: {
          followers: true,
          savedPosts: true,
        },
      },
      likes: true,
      comments: true,
    },
    where: (post, { ne }) => ne(post.userId, session?.user.id ?? ""),
    orderBy: (post, { desc }) => [desc(post.createdAt)],
  });
  return (
    <div className="container mx-auto p-2">
      <div className="my-10 flex flex-col gap-5">
        {feed.map((post) => (
          <Post
            key={post.id}
            user={post.user}
            post={post}
            likes={post.likes}
            comments={post.comments}
            following={post.user.followers}
            savedPost={post.user.savedPosts}
            ownPost={post.userId === session?.user.id}
          />
        ))}
      </div>
    </div>
  );
}
