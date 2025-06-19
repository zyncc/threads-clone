"use client";

import * as React from "react";
import {
  Bell,
  Compass,
  Home,
  Instagram,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-start">
        <Link href={"/"}>
          <Instagram />
        </Link>
      </SidebarHeader>
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
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
