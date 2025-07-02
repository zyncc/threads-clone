"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Post from "@/components/ui/post";
import { type Session } from "@/auth";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type Feed } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useState } from "react";

export default function Feed({
  feed,
  session,
}: {
  feed: Feed[];
  session: Session | null;
}) {
  const [tab, setTab] = useState("for-you");
  const {
    data: forYouFeed,
    fetchNextPage: fetchForYouNextPage,
    isFetchingNextPage: isForYouFetchingNextPage,
    hasNextPage: forYouHasNextPage,
  } = useInfiniteQuery({
    initialData: {
      pages: [{ feed, nextCursor: feed[feed.length - 1].id }],
      pageParams: [0],
    },
    queryKey: ["for-you-feed", session?.user.id],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        `/api/post/for-you-feed${pageParam ? `?cursor=${pageParam}` : ""}`,
      );
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const {
    data: followingFeed,
    fetchNextPage: fetchFollowingNextPage,
    isFetchingNextPage: isFollowingFetchingNextPage,
    hasNextPage: followingHasNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["following-feed", session?.user.id],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        `/api/post/following-feed${pageParam ? `?cursor=${pageParam}` : ""}`,
      );
      const data = await response.json();
      return data;
    },
    enabled: tab === "following",
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { ref: forYouRef } = useInView({
    onChange: (inView) => {
      if (inView && forYouHasNextPage && !isForYouFetchingNextPage) {
        fetchForYouNextPage();
      }
    },
  });

  const { ref: followingRef } = useInView({
    onChange: (inView) => {
      if (inView && followingHasNextPage && !isFollowingFetchingNextPage) {
        fetchFollowingNextPage();
      }
    },
  });

  const InfiniteForYouFeed: Feed[] =
    forYouFeed?.pages.flatMap((page) => page.feed) || [];

  const InfiniteFollowingFeed: Feed[] =
    followingFeed?.pages.flatMap((page) => page.feed) || [];

  return (
    <Tabs defaultValue={tab} onValueChange={setTab}>
      <TabsList className="container mx-auto mt-4">
        <TabsTrigger value="for-you">For You</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>
      <TabsContent value="for-you">
        <div className="my-10 flex flex-col gap-5">
          {InfiniteForYouFeed.map((post) => (
            <Post
              key={post.id}
              user={post.user}
              post={post}
              session={session}
              hasLiked={post.likes.some(
                (like) => like.userId === session?.user.id,
              )}
              savedPost={post.savedBy.some(
                (saved) => saved.userId === session?.user.id,
              )}
              isFollowedByUser={post.user.followers.some(
                (follower) => follower.followerId === session?.user.id,
              )}
              ownPost={post.userId === session?.user.id}
            />
          ))}
          {forYouHasNextPage && (
            <div ref={forYouRef}>
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="following">
        <div className="my-10 flex flex-col gap-5">
          {isPending ? (
            <div className="mt-10 flex items-start justify-center">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : (
            InfiniteFollowingFeed.map((post) => (
              <Post
                key={post.id}
                user={post.user}
                post={post}
                session={session}
                hasLiked={post.likes.some(
                  (like) => like.userId === session?.user.id,
                )}
                savedPost={post.savedBy.some(
                  (saved) => saved.userId === session?.user.id,
                )}
                isFollowedByUser={post.user.followers.some(
                  (follower) => follower.followerId === session?.user.id,
                )}
                ownPost={post.userId === session?.user.id}
              />
            ))
          )}
          {followingHasNextPage && (
            <div ref={followingRef}>
              <Loader2 className="mx-auto size-8 animate-spin" />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
