import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { user } from "@/db/schema";
import db from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";
import { eq } from "drizzle-orm";
import { Bookmark, Image as ImageIcon } from "lucide-react";

import { notFound, redirect } from "next/navigation";
import React from "react";
import AvatarDropzone from "@/components/avatar-dropzone";
import AccountPageDropdown from "@/components/client/account-page-dropdown";
import Post from "@/components/ui/post";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    return redirect("/signin");
  }

  const username = (await params).username.split("%40")[1];

  const userDetails = await db.query.user.findFirst({
    where: eq(user.username, `${username}`),
    with: {
      followers: true,
      posts: {
        limit: 20,
        with: {
          comments: {
            orderBy: (comment, { desc }) => [desc(comment.createdAt)],
          },
          likes: {
            orderBy: (like, { desc }) => [desc(like.createdAt)],
          },
        },
        orderBy: (post, { desc }) => [desc(post.createdAt)],
      },
      savedPosts: {
        limit: 20,
        with: {
          post: {
            with: {
              user: true,
              comments: {
                orderBy: (comment, { desc }) => [desc(comment.createdAt)],
              },
              likes: {
                orderBy: (like, { desc }) => [desc(like.createdAt)],
              },
            },
          },
        },
        orderBy: (savedPost, { desc }) => [desc(savedPost.createdAt)],
      },
      following: true,
    },
  });

  if (!userDetails) {
    return notFound();
  }

  return (
    <div className="container mx-auto w-full p-2">
      <div className="container mx-auto max-w-3xl space-y-4 py-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{userDetails.name}</h1>
            <p>@{userDetails.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger>
                <Avatar className="group h-16 w-16 cursor-pointer hover:opacity-25">
                  <AvatarImage
                    src={userDetails.image!}
                    alt={userDetails.name}
                  />
                  <AvatarFallback>
                    {userDetails.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Profile Picture</DialogTitle>
                </DialogHeader>
                <AvatarDropzone />
              </DialogContent>
            </Dialog>
            <AccountPageDropdown />
          </div>
        </div>
        {userDetails.bio && (
          <div className="space-y-1">
            {userDetails.bio.split("\n").map((line, index) => (
              <p key={index} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="flex -space-x-1">
              {userDetails.followers.map((follower, index) => (
                <Avatar key={index} className="h-6 w-6 border-2 border-black">
                  <AvatarImage
                    src={userDetails.image!}
                    alt={`Follower ${index + 1}`}
                  />
                  <AvatarFallback className="bg-gray-700 text-xs">
                    U
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <p className="cursor-pointer underline-offset-2 hover:underline">
                  {userDetails.followers.length} followers
                </p>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="hidden">Followers</DialogTitle>
                <Tabs defaultValue="followers">
                  <TabsList className="w-full">
                    <TabsTrigger value="followers">Followers</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                  </TabsList>
                  <TabsContent value="followers">
                    Make changes to your account here.
                  </TabsContent>
                  <TabsContent value="following">
                    Change your password here.
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div>
        <Tabs defaultValue="posts">
          {session.user.username == userDetails.username && (
            <>
              <TabsList className="mx-auto w-full max-w-3xl">
                <TabsTrigger value="posts">
                  <ImageIcon /> Posts
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark /> Saved
                </TabsTrigger>
              </TabsList>
            </>
          )}
          <TabsContent value="posts">
            <div className="my-10 flex flex-col gap-5">
              {userDetails?.posts.map((post) => (
                <Post
                  key={post.id}
                  user={userDetails}
                  post={post}
                  likes={post.likes}
                  following={userDetails.following}
                  comments={post.comments}
                  savedPost={userDetails.savedPosts}
                  ownPost={session.user.username == userDetails.username}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved">
            {userDetails.savedPosts.length > 0 ? (
              <div className="my-10 flex flex-col gap-5">
                {userDetails.savedPosts.map((savedPost) => (
                  <Post
                    key={savedPost.id}
                    user={savedPost.post!.user!}
                    post={savedPost.post!}
                    likes={savedPost.post!.likes}
                    following={userDetails.following}
                    comments={savedPost.post!.comments}
                    savedPost={userDetails.savedPosts}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto my-10 flex items-center justify-center">
                <h3>No saved posts</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
