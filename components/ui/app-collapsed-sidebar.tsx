"use client";

import {
  BadgeCheck,
  Bell,
  Bookmark,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import CreatePostDropzone from "../create-post-dropzone";
import { SiThreads } from "react-icons/si";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppCollapsedSidebar() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  return (
    <>
      {/* MOBILE ONLY BOTTOM TABS */}
      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 flex w-full items-center justify-between gap-x-5 px-5 py-3 min-md:hidden">
        <Link href={"/"}>
          <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
            <Home className="size-6" />
          </Button>
        </Link>
        <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
          <Link href={"/search"}>
            <Search className="size-6" />
          </Link>
        </Button>
        <CreatePostDropzone />
        <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
          <Link href={"/messages"}>
            <MessageCircle className="size-6" />
          </Link>
        </Button>
        <Link href={`/@${session?.user.username}`}>
          <Avatar>
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="rounded-lg">
              {isPending ? "L" : session?.user?.name?.[0]}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      {/* DESKTOP ONLY SIDEBAR */}
      <div className="bg-background fixed top-0 bottom-0 left-0 z-50 hidden h-screen w-16 flex-col items-center justify-center min-md:flex">
        <Link href={"/"}>
          <SiThreads size={30} className="mt-5 cursor-pointer" />
        </Link>
        <div className="flex h-full flex-col items-center justify-center gap-7">
          <Link href={"/"}>
            <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
              <Home className="size-7" />
            </Button>
          </Link>
          <Link href={"/search"}>
            <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
              <Search className="size-7" />
            </Button>
          </Link>
          <Link href={"/explore"}>
            <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
              <Compass className="size-7" />
            </Button>
          </Link>
          <CreatePostDropzone />
          <Link href={"/messages"}>
            <Button variant={"ghost"} className="cursor-pointer" size={"icon"}>
              <MessageCircle className="size-7" />
            </Button>
          </Link>
        </div>
        <div className="mb-5 flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage
                  src={session?.user.image ?? undefined}
                  alt={session?.user.name ?? ""}
                />
                <AvatarFallback className="rounded-full select-none">
                  {isPending ? "L" : session?.user.name?.[0]}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={session?.user.image ?? undefined}
                      alt={session?.user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {isPending ? "L" : session?.user.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {isPending ? "Loading.." : session?.user.name}
                    </span>
                    <span className="truncate text-xs">
                      {isPending ? "Loading.." : `@${session?.user.username}`}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href={`/@${session?.user.username}`}>
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
                <Link href={`/@${session?.user.username}?tab=saved`}>
                  <DropdownMenuItem>
                    <Bookmark />
                    Saved
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <Button
                  className="flex w-full justify-start p-0 text-left"
                  variant={"ghost"}
                  onClick={() => {
                    theme.setTheme(theme.theme === "dark" ? "light" : "dark");
                  }}
                >
                  {theme.theme === "dark" ? <Sun /> : <Moon />}
                  Switch Appearance
                </Button>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <Button
                variant={"ghost"}
                className="flex w-full justify-start p-0 text-left"
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/signin");

                        queryClient.clear();
                      },
                    },
                  });
                }}
              >
                <LogOut />
                Log out
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
