"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function Home() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <section className="space-y-6 pb-8 w-full pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="flex flex-col items-center gap-4 text-center">
        {session?.user ? (
         <div className="flex flex-row w-full">
            <SidebarProvider>
              <AppSidebar user={session?.user} activePath={pathname}>
                <div className="flex flex-col justify-center items-center gap-4 text-center w-full">
                  <h2 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-black">
                    Welcome, {session?.user?.name || "User"}! Your Journey to Self-Discovery Begins
                  </h2>
                  <p className="max-w-[42rem] leading-normal text-gray-800 sm:text-xl sm:leading-8">
                    Dive into tools like Ikigai for purpose, Project Ideation for innovation, and Cohort Roadmap for structured growth. Discover your potential and chart your unique path.
                  </p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    <Link href="/ikigai" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300">
                      <svg className="w-12 h-12 text-orange-500 mb-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <h3 className="text-xl font-semibold mb-2 text-black">Discover Your Ikigai</h3>
                      <p className="text-sm text-gray-700">Find your purpose and passion at the intersection of what you love, what you&apos;re good at, what the world needs, and what you can be paid for.</p>
                    </Link>
                    <Link href="/project-ideation" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300">
                      <svg className="w-12 h-12 text-orange-500 mb-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      <h3 className="text-xl font-semibold mb-2 text-black">Innovate with Project Ideation</h3>
                      <p className="text-sm text-gray-700">Generate and refine groundbreaking project ideas, turning concepts into actionable plans.</p>
                    </Link>
                    <Link href="/cohort-roadmap" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300">
                      <svg className="w-12 h-12 text-orange-500 mb-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <h3 className="text-xl font-semibold mb-2 text-black">Navigate Your Cohort Roadmap</h3>
                      <p className="text-sm text-gray-700">Track your progress, explore learning modules, and stay aligned with your cohort&apos;s journey.</p>
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
      <Toaster />
    </section>
  );
}
