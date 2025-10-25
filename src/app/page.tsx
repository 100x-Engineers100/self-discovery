"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        {session?.user ? (
         <div className="flex flex-row w-full">
            <SidebarProvider>
              <AppSidebar user={session?.user} activePath={pathname}>
                <div className="flex flex-col items-center gap-4 text-center w-full">
                  <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Welcome, {session?.user?.name || "User"}!
                  </h1>
                  <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Explore your self-discovery journey.
                  </p>
                  <div className="space-x-4">
                    <Link href="/ikigai">
                      <Button>Ikigai</Button>
                    </Link>
                    <Link href="/project-ideation">
                      <Button variant="outline">Project Ideation</Button>
                    </Link>
                    <Link href="/cohort-roadmap">
                      <Button variant="outline">Cohort Roadmap</Button>
                    </Link>
                  </div>
                </div>
              </AppSidebar>
            </SidebarProvider>
          </div>
        ) : (
           <></>
        )}
      </div>
    </section>
  );
}
