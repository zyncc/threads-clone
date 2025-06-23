"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type followers,
  type comments,
  type likes,
  type post,
  type user,
  type savedPosts,
} from "@/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import { toast } from "sonner";

type Props = {
  user: InferSelectModel<typeof user>;
  post: InferSelectModel<typeof post>;
  likes: InferSelectModel<typeof likes>[];
  comments: InferSelectModel<typeof comments>[];
  following: InferSelectModel<typeof followers>[];
  savedPost?: InferSelectModel<typeof savedPosts>[];
  ownPost?: boolean;
};

export default function Post({
  post,
  user,
  likes,
  comments,
  following,
  ownPost,
  savedPost,
}: Props) {
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/post/${post.id}`, {
      method: "POST",
    });
    setLoading(false);
  }
  const isFollowingPostAuthor = following.find(
    (f) => f.followingId === post.userId,
  );
  const isSavedPost = savedPost?.find((s) => s.postId === post.id);

  async function handleFollowButton() {}
  async function handleBookmark() {
    await fetch("/api/bookmark", {
      method: "POST",
      body: JSON.stringify({
        postId: post.id,
      }),
    });
    toast.success("Post bookmarked successfully");
  }
  async function handleLike() {
    await fetch("/api/like", {
      method: "POST",
      body: JSON.stringify({
        postId: post.id,
      }),
    });
  }
  return (
    <Card key={post.id} className="mx-auto h-fit w-full max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <Link href={`/@${user.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image!} alt={user.username} />
              <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <HoverCard>
              <HoverCardTrigger>
                <p className="text-sm leading-none font-semibold">
                  @{user.username}
                </p>
              </HoverCardTrigger>
              <HoverCardContent>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image!} alt={user.username} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="text-sm leading-none font-semibold">
                  @{user.username}
                </p>
              </HoverCardContent>
            </HoverCard>
            <p className="text-muted-foreground mt-1 text-xs">
              {post.createdAt.toDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-x-5">
          {!ownPost && !isFollowingPostAuthor && (
            <Button
              onClick={handleFollowButton}
              variant={"outline"}
              size={"sm"}
            >
              Follow
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Share post</DropdownMenuItem>
              {ownPost && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your post and remove your data from our
                          servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            disabled={loading}
                            onClick={handleDelete}
                            variant={"destructive"}
                            className="m-0"
                          >
                            {loading ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{post.description}</p>
        {post.images && post.images.length > 0 && (
          <div className="space-y-2">
            {post.images.length === 1 ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Dialog>
                  <DialogTrigger>
                    <Image
                      src={post.images[0]}
                      alt="Post image"
                      fill
                      className="object-cover"
                    />
                  </DialogTrigger>
                  <DialogContent className="overflow-hidden">
                    <DialogTitle className="hidden"></DialogTitle>
                    <Image
                      src={post.images[0]}
                      alt="Post image"
                      height={1000}
                      width={1000}
                      className="object-cover"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {post.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    <Dialog>
                      <DialogTrigger>
                        <Image
                          src={image}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </DialogTrigger>
                      <DialogContent className="aspect-video h-screen w-full">
                        <DialogTitle className="hidden"></DialogTitle>
                        <Image
                          src={image}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </DialogContent>
                    </Dialog>
                    {index === 3 && post.images!.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="font-semibold text-white">
                          +{post.images!.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleLike}
              size="sm"
              className={`h-8 px-2 ${likes.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart
                className={`mr-1 h-4 w-4 ${likes.length > 0 ? "fill-current" : ""}`}
              />
              <span className="text-xs">{likes.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 px-2"
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              <span className="text-xs">{comments.length}</span>
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className="text-muted-foreground h-8 px-2"
            >
              <Bookmark
                className="h-4 w-4"
                fill={isSavedPost ? "#e1dfee" : "transparent"}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
