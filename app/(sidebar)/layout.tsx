import type { Metadata } from "next";
import AppCollapsedSidebar from "@/components/ui/app-collapsed-sidebar";
import { ReactQueryProvider } from "@/providers/react-query-provider";

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
    <ReactQueryProvider>
      <AppCollapsedSidebar />
      {children}
    </ReactQueryProvider>
  );
}
