"use client";

import * as React from "react";
import { Bell, Compass, Home, MessageCircle, Plus, Search } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import CreatePostDropzone from "./create-post-dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { authClient } from "@/lib/auth-client";

export function AppSidebar() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <>
      <div className="bg-accent fixed right-0 bottom-0 left-0 flex w-full items-center justify-between gap-x-5 px-5 py-3 min-md:hidden">
        <Home className="shrink-0" />
        <Search className="shrink-0" />
        <Compass className="shrink-0" />
        <Plus className="shrink-0" />
        <MessageCircle className="shrink-0" />
        <Avatar>
          <AvatarImage src={session?.user?.image ?? undefined} />
          <AvatarFallback className="rounded-lg">
            {isPending ? "L" : session?.user?.name?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <Sidebar className="hidden min-md:block" collapsible="icon">
        <SidebarContent>
          <SidebarMenu className="px-0">
            <SidebarMenuItem className="p-2">
              <SidebarMenuButton asChild className="py-5">
                <Link href="/">
                  <Home />
                  Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="p-2">
              <SidebarMenuButton asChild className="py-5">
                <Link href="/search">
                  <Search />
                  Search
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="p-2">
              <SidebarMenuButton asChild className="py-5">
                <Link href="/explore">
                  <Compass />
                  Explore
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="p-2">
              <SidebarMenuButton asChild className="py-5">
                <Link href="/messages">
                  <MessageCircle />
                  Messages
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="p-2">
              <SidebarMenuButton asChild className="py-5">
                <Link href="/notifications">
                  <Bell />
                  Notifications
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="p-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton className="py-5">
                    <Plus />
                    Create
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Post</AlertDialogTitle>
                  </AlertDialogHeader>
                  <CreatePostDropzone />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Create</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            name={session?.user.name ?? undefined}
            image={session?.user.image ?? undefined}
            username={session?.user.username ?? undefined}
            isPending={isPending}
          />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
