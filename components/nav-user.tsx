"use client";

import {
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronsUpDown,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const theme = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user.name}
                />
                <AvatarFallback className="rounded-lg">
                  {isPending ? "L" : session?.user.name[0]}
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
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={session?.user.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {isPending ? "L" : session?.user.name[0]}
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
              <Link href={"/account"}>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <Link href={"/saved"}>
                <DropdownMenuItem>
                  <Bookmark />
                  Saved
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </Link>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
