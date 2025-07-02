"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Image as ImageIcon, Loader2 } from "lucide-react";
import React, { useState } from "react";
import AvatarDropzone from "@/components/avatar-dropzone";
import AccountPageDropdown from "@/components/client/account-page-dropdown";
import Post from "@/components/ui/post";
import { type Session } from "@/auth";
import { type Feed } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { InfinitePostFeedSize } from "@/lib/constants";

export default function AccountFeed({
  session,
  feed,
}: {
  session: Session;
  feed: Feed[];
}) {
  const [tab, setTab] = useState("posts");
  const {
    data: feedData,
    hasNextPage: accountFeedHasNextPage,
    fetchNextPage: accountFeedNextPage,
    isFetchingNextPage: accountFeedFetchingNextPage,
  } = useInfiniteQuery({
    initialData: {
      pages: [
        {
          feed,
          nextCursor:
            feed.length > InfinitePostFeedSize
              ? feed[feed.length - 1].id
              : null,
        },
      ],
      pageParams: [0],
    },
    queryKey: ["account-feed", session.user.id],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        `/api/post/account-feed?cursor=${pageParam}`,
      );
      const data = await response.json();
      return data;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const {
    data: savedFeedData,
    fetchNextPage: fetchSavedNextPage,
    isFetchingNextPage: isSavedFetchingNextPage,
    hasNextPage: savedHasNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["saved-feed", session?.user.id],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        `/api/post/saved-feed${pageParam ? `?cursor=${pageParam}` : ""}`,
      );
      const data = await response.json();
      return data;
    },
    enabled: tab === "saved",
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    initialPageParam: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { ref: accountFeedRef } = useInView({
    onChange: (inView) => {
      if (inView && accountFeedHasNextPage && !accountFeedFetchingNextPage) {
        accountFeedNextPage();
      }
    },
  });

  const { ref: savedFeedRef } = useInView({
    onChange: (inView) => {
      if (inView && savedHasNextPage && !isSavedFetchingNextPage) {
        fetchSavedNextPage();
      }
    },
  });

  const InfiniteFeedData: Feed[] =
    feedData?.pages.flatMap((page) => page.feed) || [];

  const InfiniteSavedFeedData: Feed[] =
    savedFeedData?.pages.flatMap((page) => page.feed) || [];

  return (
    <div className="container mx-auto w-full p-2">
      <div className="container mx-auto max-w-3xl space-y-4 py-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{feed[0].user.name}</h1>
            <p>@{feed[0].user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger>
                <Avatar className="group h-16 w-16 cursor-pointer hover:opacity-25">
                  <AvatarImage
                    src={feed[0].user.image!}
                    alt={feed[0].user.name}
                  />
                  <AvatarFallback>
                    {feed[0].user.name
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
        {feed[0].user.bio && (
          <div className="space-y-1">
            {feed[0].user.bio.split("\n").map((line, index) => (
              <p key={index} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            {/* <Dialog>
                <DialogTrigger asChild>
                  <p className="cursor-pointer underline-offset-2 hover:underline">
                    {feed.user?.followers.length} followers
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
                      {feed.followers.map((follower) => (
                        <div key={follower.id}>
                          <p>{follower.follower.name}</p>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="following">
                      {feed.following.map((following) => (
                        <div key={following.id}>
                          <p>{following.following.name}</p>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog> */}
          </div>
        </div>
      </div>
      <div>
        <Tabs defaultValue={tab} onValueChange={setTab}>
          {session.user.username == feed[0].user.username && (
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
              {InfiniteFeedData.map((post) => (
                <Post
                  key={post.id}
                  user={post.user}
                  post={post}
                  session={session}
                  savedPost={post.savedBy[0]?.userId === session?.user.id}
                  hasLiked={post.likes.some(
                    (like) => like.userId === session?.user.id,
                  )}
                  isFollowedByUser={post.user.followers.some(
                    (follower) => follower.followerId === session?.user.id,
                  )}
                  ownPost={post.userId === session?.user.id}
                />
              ))}
              {accountFeedHasNextPage && (
                <div ref={accountFeedRef}>
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="saved">
            {isPending ? (
              <div className="mt-10 flex items-start justify-center">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <div className="my-10 flex flex-col gap-5">
                {InfiniteSavedFeedData.map((post) => {
                  if (!post.user) return null;
                  return (
                    <Post
                      key={post.id}
                      user={post.user}
                      post={post}
                      session={session}
                      savedPost={post.savedBy?.[0]?.userId === session?.user.id}
                      hasLiked={post.likes.some(
                        (like) => like.userId === session?.user.id,
                      )}
                      isFollowedByUser={post.user.followers.some(
                        (follower) => follower.followerId === session?.user.id,
                      )}
                      ownPost={post.userId === session?.user.id}
                    />
                  );
                })}
                {savedHasNextPage && (
                  <div ref={savedFeedRef}>
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>
            )}
            {!isPending && InfiniteSavedFeedData.length === 0 && (
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
