import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppCollapsedSidebar from "@/components/ui/app-collapsed-sidebar";

export const metadata: Metadata = {
  title: "Threads Clone",
  description: "Threads Clone",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppCollapsedSidebar />
      {children}
    </SidebarProvider>
  );
}
