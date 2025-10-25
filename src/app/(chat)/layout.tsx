"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { User } from "next-auth";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simulate session and isCollapsed for now
  const session = { user: { name: "Guest", type: "user" as User["type"] } };
  const isCollapsed = false;

  return (
    <>
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session?.user} activePath="/" >
            {children}
          </AppSidebar>
          <SidebarInset />
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}