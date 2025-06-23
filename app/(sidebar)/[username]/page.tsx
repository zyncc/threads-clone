import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { user } from "@/db/schema";
import db from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";
import { eq } from "drizzle-orm";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Bookmark,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React from "react";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession();
  if (!session) {
    return redirect("/signin");
  }

  const username = (await params).username.split("%40")[1];
  const tab = (await searchParams).tab || "posts";

  if (tab !== "posts" && tab !== "saved") {
    return notFound();
  }

  const userDetails = await db.query.user.findFirst({
    where: eq(user.username, username),
    with: {
      followers: true,
      posts: {
        limit: 20,
        with: {
          comments: true,
          likes: true,
        },
        orderBy: (user, { desc }) => [desc(user.createdAt)],
      },
      savedPosts: {
        limit: 20,
      },
      following: true,
    },
  });

  console.log(userDetails);

  if (!userDetails) {
    return notFound();
  }

  return (
    <div className="container mx-auto w-full p-2">
      <div className="container mx-auto mt-10 flex items-start justify-center p-2">
        <div className="flex items-center gap-20">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <h2>@{session?.user?.username}</h2>
              <Button variant={"outline"}>Edit Profile</Button>
            </div>
            <div className="flex gap-x-5">
              <p>{userDetails?.posts.length} posts</p>
              <p>{userDetails?.followers.length} followers</p>
              <p>{userDetails?.following.length} following</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <h2>{session?.user?.name}</h2>
              <p>{session?.user?.bio}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Tabs defaultValue={tab as string}>
          <TabsList>
            <TabsTrigger value="posts">
              <ImageIcon /> Posts
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark /> Saved
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <div className="my-10 flex flex-col gap-5">
              {userDetails?.posts.map((post) => (
                <Card key={post.id} className="mx-auto h-fit w-full max-w-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center space-x-3">
                      <Link href={`/@${userDetails.username}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={userDetails.image!}
                            alt={userDetails.username}
                          />
                          <AvatarFallback>
                            {userDetails.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex flex-col">
                        <HoverCard>
                          <HoverCardTrigger>
                            <p className="text-sm leading-none font-semibold">
                              @{userDetails.username}
                            </p>
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={userDetails.image!}
                                alt={userDetails.username}
                              />
                              <AvatarFallback>
                                {userDetails.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm leading-none font-semibold">
                              @{userDetails.username}
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {post.createdAt.toDateString()}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>Share post</DropdownMenuItem>
                        <DropdownMenuItem>Copy link</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Report post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">
                      {post.description}
                    </p>
                    {post.images && post.images.length > 0 && (
                      <div className="space-y-2">
                        {post.images.length === 1 ? (
                          <div className="relative aspect-square overflow-hidden rounded-lg">
                            <Dialog>
                              <DialogTrigger>
                                <Image
                                  src={post.images[0]}
                                  alt="Post image"
                                  fill
                                  className="object-cover"
                                />
                              </DialogTrigger>
                              <DialogContent className="h-screen overflow-hidden">
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
                          size="sm"
                          className={`h-8 px-2 ${post.likes.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          <Heart
                            className={`mr-1 h-4 w-4 ${post.likes.length > 0 ? "fill-current" : ""}`}
                          />
                          <span className="text-xs">{post.likes.length}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground h-8 px-2"
                        >
                          <MessageCircle className="mr-1 h-4 w-4" />
                          <span className="text-xs">
                            {post.comments.length}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved">
            <div className="my-10 flex flex-wrap justify-between gap-5"></div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
