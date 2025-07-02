"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useInView } from "react-intersection-observer";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Bookmark,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
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
import { toast } from "sonner";
import { commentSchema } from "@/lib/zod-schemas";
import { useIsMobile } from "@/hooks/use-mobile";
import { type z } from "zod";
import timeAgo from "@/lib/utils";
import { type User } from "@prisma/client";
import { type Post as PostType } from "@prisma/client";
import { type CommentWithUser } from "@/lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type Session } from "@/auth";
import useFollowButton from "@/hooks/useFollowButton";
import parse from "html-react-parser";

type Props = {
  user: User;
  post: PostType;
  session: Session | null;
  isFollowedByUser: boolean;
  hasLiked: boolean;
  savedPost: boolean;
  ownPost: boolean;
};

export default function Post({
  post,
  user,
  session,
  isFollowedByUser,
  hasLiked,
  ownPost,
  savedPost,
}: Props) {
  const [loading, setLoading] = useState(false);
  // const queryClient = useQueryClient();
  async function handleDeletePost() {
    setLoading(true);
    await fetch(`/api/post/${post.id}`, {
      method: "DELETE",
    });
    setLoading(false);
    // queryClient.invalidateQueries({
    //   queryKey: ["account-feed", session?.user.id],
    // });
  }

  const { mutate: mutateFollowAction, data: followData } = useFollowButton(
    post.userId,
    isFollowedByUser,
  );

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
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-x-5">
          {!ownPost && (
            <FollowButton
              userId={post.userId}
              initialFollowing={isFollowedByUser}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {followData.following ? (
                <DropdownMenuItem onSelect={() => mutateFollowAction()}>
                  Unfollow
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem>Share post</DropdownMenuItem>
              {ownPost && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                            onClick={handleDeletePost}
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
        <div className="text-sm leading-relaxed">{parse(post.description)}</div>
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
            <LikeButton
              postId={post.id}
              hasLiked={hasLiked}
              likeCount={post.likeCount}
            />
            <Comments post={post} session={session} />
          </div>
          <BookmarkButton
            postId={post.id}
            session={session}
            savedPost={savedPost}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Comments({
  post,
  session,
}: {
  post: PostType;
  session: Session | null;
}) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { ref } = useInView({
    rootMargin: "200px",
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: "",
    },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ["comments", post.id],
      queryFn: async ({ pageParam }) => {
        const comments = await fetch(
          `/api/post/comments/${post.id}${pageParam ? `?cursor=${pageParam}` : ""}`,
        );
        const data: { comments: CommentWithUser[]; nextCursor: string | null } =
          await comments.json();
        return data;
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: isSheetOpen || isDrawerOpen,
      staleTime: Infinity,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    });

  const comments = data?.pages.flatMap((page) => page.comments) || [];

  async function commentSubmit({ comment }: z.infer<typeof commentSchema>) {
    await fetch(`/api/post/comment/${post.id}`, {
      method: "POST",
      body: JSON.stringify({ comment: comment }),
    });
    form.reset();
    await queryClient.invalidateQueries({
      queryKey: ["comments", post.id],
    });
  }
  if (isMobile)
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 px-2"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{post.commentCount}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[calc(100vh-5rem)]">
          <DrawerHeader>
            <DrawerTitle>Comments</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-y-2 overflow-y-auto py-3">
            {isPending && (
              <div className="flex h-full w-full items-start justify-center">
                <Loader2 className="mt-10 size-10 animate-spin" />
              </div>
            )}
            {comments.length == 0 && (
              <p className="text-muted-foreground text-center">
                No comments yet.
              </p>
            )}
            {!isPending &&
              comments.map((comment) => (
                <CommentCard
                  postId={post.id}
                  ownComment={comment.userId === session?.user.id}
                  key={comment.id}
                  comment={comment}
                />
              ))}
            {hasNextPage && (
              <div
                ref={ref}
                className="flex w-full items-center justify-center"
              >
                <Loader2 className="my-4 size-7 animate-spin" />
              </div>
            )}
          </div>
          <DrawerFooter className="border-t">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(commentSubmit)}
                className="flex items-end justify-between gap-x-2"
              >
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormMessage />
                      <FormControl>
                        <Input
                          autoComplete="off"
                          autoFocus={false}
                          placeholder="Share your thoughts..."
                          className="ring-0 focus:ring-0 focus-visible:ring-0"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button size={"icon"} variant={"outline"} type="submit">
                  <Send />
                </Button>
              </form>
            </Form>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 px-2"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          <span className="text-xs">{post.commentCount}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-md gap-y-1">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>
        <div className="scrollbar-thin flex flex-col gap-y-2 overflow-y-auto py-3">
          {isPending && (
            <div className="flex h-full w-full items-start justify-center">
              <Loader2 className="mt-10 size-10 animate-spin" />
            </div>
          )}
          {!isPending &&
            comments.map((comment) => (
              <CommentCard
                postId={post.id}
                ownComment={comment.userId == session?.user.id}
                key={comment.id}
                comment={comment}
              />
            ))}
          {hasNextPage && (
            <div ref={ref} className="flex w-full items-center justify-center">
              <Loader2 className="my-4 size-7 animate-spin" />
            </div>
          )}
        </div>
        <SheetFooter className="border-t py-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(commentSubmit)}
              className="flex items-end justify-between gap-x-2"
            >
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormMessage />
                    <FormControl>
                      <Input
                        placeholder="Share your thoughts..."
                        autoFocus={false}
                        autoComplete="off"
                        className="ring-0 focus:ring-0 focus-visible:ring-0"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button size={"icon"} variant={"outline"} type="submit">
                <Send />
              </Button>
            </form>
          </Form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CommentCard({
  postId,
  comment,
  ownComment,
}: {
  postId: string;
  comment: CommentWithUser;
  ownComment: boolean;
}) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async () => {
      await fetch(`/api/post/comment/${postId}?commentId=${comment.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
      });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
  function handleDeleteComment() {
    mutate();
  }

  return (
    <Card className="mx-2 border-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex justify-between gap-3">
          <Link
            href={`/@${comment.user?.username}`}
            className="text-foreground text-sm font-medium"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage
                src={comment.user?.image ?? undefined}
                alt={comment.user?.username}
              />
              <AvatarFallback className="text-xs">
                {comment.user?.name?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href={`/@${comment.user?.username}`}
                  className="text-foreground text-sm font-medium"
                >
                  @{comment.user?.username}
                </Link>
                <span className="text-muted-foreground text-xs">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {ownComment && (
                    <>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          handleDeleteComment();
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Flag className="mr-2 h-4 w-4" />
                    Report comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-foreground mb-2 text-sm leading-relaxed">
              {comment.content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LikeButton({
  postId,
  likeCount,
  hasLiked,
}: {
  postId: string;
  likeCount: number;
  hasLiked: boolean;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["likes", postId],
    initialData: { hasLiked, likeCount },
    queryFn: async () => {
      const response = await fetch(`/api/user/liked/${postId}`);
      const data: { hasLiked: boolean; likeCount: number } =
        await response.json();
      return data;
    },
    staleTime: Infinity,
  });
  const { mutate } = useMutation({
    mutationFn: async () => {
      await fetch(`/api/post/like/${postId}`, {
        method: data?.hasLiked ? "DELETE" : "POST",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["likes", postId],
      });
      const previousState = queryClient.getQueryData<{
        hasLiked: boolean;
        likeCount: number;
      }>(["likes", postId]);

      const likeCount = previousState?.likeCount ?? 0;

      queryClient.setQueryData<{ hasLiked: boolean; likeCount: number }>(
        ["likes", postId],
        {
          hasLiked: !previousState?.hasLiked,
          likeCount: likeCount + (previousState?.hasLiked ? -1 : 1),
        },
      );
      return { previousState };
    },
    onError(error, _, context) {
      queryClient.setQueryData<{ hasLiked: boolean; likeCount: number }>(
        ["likes", postId],
        context?.previousState,
      );
      console.error(error);
      toast.error("Something went wrong");
    },
  });
  return (
    <Button
      variant="ghost"
      onClick={() => mutate()}
      size="sm"
      className={`h-8 px-2 ${data.hasLiked ? "hover:text-red-500" : "hover:text-muted-foreground"} ${data.hasLiked ? "text-red-500" : "text-muted-foreground"}`}
    >
      <Heart
        className={`mr-1 h-4 w-4 ${data.hasLiked ? "fill-current" : ""}`}
      />
      <span className="text-xs">{data.likeCount}</span>
    </Button>
  );
}

function BookmarkButton({
  postId,
  savedPost,
  session,
}: {
  postId: string;
  savedPost: boolean;
  session: Session | null;
}) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["savedPost", postId],
    initialData: { savedPost },
    queryFn: async () => {
      const response = await fetch(`/api/user/savedpost${postId}`);
      const data: { savedPost: boolean } = await response.json();
      return data;
    },
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: async () => {
      await fetch(`/api/post/bookmark/${postId}`, {
        method: data.savedPost ? "DELETE" : "POST",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["savedPost", postId] });

      const previousState = queryClient.getQueryData<{ savedPost: boolean }>([
        "savedPost",
        postId,
      ]);

      queryClient.setQueryData<{ savedPost: boolean }>(["savedPost", postId], {
        savedPost: !previousState?.savedPost,
      });
      return { previousState };
    },
    onError(error, _, context) {
      queryClient.setQueryData<{ savedPost: boolean }>(
        ["savedPost", postId],
        context?.previousState,
      );
      console.error(error);
      toast.error("Something went wrong");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saved-feed", session?.user.id],
      });
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutate()}
      className="text-muted-foreground h-8 px-2"
    >
      <Bookmark
        className="h-4 w-4"
        fill={data?.savedPost ? "#e1dfee" : "transparent"}
      />
    </Button>
  );
}

function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const { data, mutate } = useFollowButton(userId, initialFollowing);

  if (!data.following)
    return (
      <Button variant={"secondary"} onClick={() => mutate()}>
        Follow
      </Button>
    );
}
