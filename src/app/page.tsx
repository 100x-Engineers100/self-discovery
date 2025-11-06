"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Toaster, toast } from "sonner";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import useSWR from "swr";
import { IkigaiApiResponse } from "@/lib/types";
import { signOut } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: ikigaiDataList, error: ikigaiError, isLoading: isIkigaiDataLoading } = useSWR(
    session?.user ? `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${session.user.id}` : null,
    fetcher
  );

  const latestIkigaiData = ikigaiDataList && ikigaiDataList.length > 0 
    ? ikigaiDataList
        .filter((ikigai: IkigaiApiResponse) => ikigai.ikigai_details?.status === "complete")
        .sort((a: IkigaiApiResponse, b: IkigaiApiResponse) => b.chat_number - a.chat_number)[0] 
    : null;

  const isIkigaiComplete = latestIkigaiData?.ikigai_details?.status === "complete";

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    if (isIkigaiDataLoading) {
      e.preventDefault();
      toast.info("Loading Ikigai status, please wait...");
      return;
    }
    
    if (!isIkigaiComplete && (path === "/project-ideation" || path === "/cohort-roadmap")) {
      e.preventDefault();
      toast.error("Please complete your Ikigai chart first to access this page.");
      return;
    }
  };

  const handleLogout = async () => {
    // Clear local storage
    localStorage.clear();
    // Clear session storage
    sessionStorage.clear();
    // Clear cookies (this might require a more specific approach depending on how cookies are set)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b bg-background">
        <div className="mx-4 flex h-16 items-center justify-between space-x-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/100xEngineers-black.svg" alt="100xEngineers Logo" width={150} height={30} />
            </Link>
          </div>
          <div>
              <nav className="flex justify-center gap-6 bg-gray-100 px-4 py-2 rounded-md">
              <Link
                href="/ikigai"
                className="flex items-center text-base font-mono text-black"
              >
                Ikigai
              </Link>
              <Link
                href="/project-ideation"
                className="flex items-center text-base font-mono text-black"
                onClick={(e) => handleNavigation(e, "/project-ideation")}
              >
                Project Ideation
              </Link>
              <Link
                href="/cohort-roadmap"
                className="flex items-center text-base font-mono text-black"
                onClick={(e) => handleNavigation(e, "/cohort-roadmap")}
              >
                Cohort Roadmap
              </Link>
            </nav>
          </div>
          <div className="flex items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {session?.user ? (
                <Button variant="default" size="sm" asChild onClick={handleLogout}>
                  <Link href="#">Logout</Link>
                </Button>
              ) : (
                <Button variant="default" size="sm" asChild className="bg-orange-500 text-white hover:bg-orange-600">
                  <Link href="/login">Start Journey</Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-white text-black overflow-hidden">
        <Image
          src="/ikigai-home.png"
          alt="Cherry Blossom Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="absolute inset-0 z-0 opacity-30"
        />  
        <div className=" px-4 md:px-6 text-center relative z-10">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-4xl tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-sans">
              Find Your <span className="text-orange-500">Ikigai</span>.
            </h1>
            <h1 className="text-4xl tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-sans">
              Shape Your Journey.
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-700 md:text-xl font-mono">
              A guided space to understand yourself, refine your ideas, and build your path through the cohort.
            </p>
            <div className="space-x-4">
              <Link
                href="/ikigai"
                className="inline-flex font-mono h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Begin Your Self Discovery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Find Your Ikigai Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white text-black">
        <div className=" px-4 md:px-6 grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="mx-auto overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-first">
            <Image
              src="/ikigai-chart.png"
              alt="Ikigai Diagram"
              width={500}
              height={500}
              className="mx-auto"
            />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl tracking-tighter sm:text-5xl">
                Find Your Ikigai <br /> Your Reason for Being
              </h2>
              <p className="max-w-[600px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-mono">
                Ikigai is a Japanese concept that means &quot;reason
                for being.&quot; It&apos;s the intersection of what you
                love, what you&apos;re good at, what the world
                needs, and what you can be paid for.
              </p>
              <p className="max-w-[600px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-mono">
                In tech, your Ikigai guides you to projects
                that fulfill AND challenge you.
              </p>
              <p className="max-w-[600px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-mono">
                Our AI-powered tool helps you discover this
                sweet spot through thoughtful conversations,
                turning self-reflection into actionable
                learning paths.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="/ikigai"
                className="font-mono inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Chat with the Mentor Bot &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Your Journey in 3 Simple Steps Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-sans tracking-tighter sm:text-5xl text-black">
                Your Journey in 3 Simple Steps
              </h2>
              <p className="max-w-[900px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-mono">
                From confusion to clarity in less than 30 minutes
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-4xl items-start gap-8 sm:grid-cols-1 md:grid-cols-3 lg:gap-10 mt-12">
            <div className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300 text-center">
              <Image src="/chat.png" alt="Chat Icon" width={60} height={60} className="mb-4 w-full h-auto" />
              <h3 className="text-xl font-semibold mb-2 text-black">Chat & Discover</h3>
              <p className="text-sm text-gray-700 font-mono">Have a natural conversation with our AI guide. It asks thoughtful questions about your interests, skills, dreams, and what energizes you.</p>
            </div>
            <div className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300 text-center">
              <Image src="/ideate.png" alt="Ideate Icon" width={60} height={60} className="mb-4 w-full h-auto" />
              <h3 className="text-xl font-semibold mb-2 text-black">Ideate Your Project</h3>
              <p className="text-sm text-gray-700 font-mono">Choose from 4 cutting-edge modules. Our AI helps you brainstorm project ideas that align with your discovered purpose.</p>
            </div>
            <div className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300 text-center">
              <Image src="/roadmap.png" alt="Roadmap Icon" width={60} height={60} className="mb-4 w-full h-auto" />
              <h3 className="text-xl font-semibold mb-2 text-black">Follow Your Roadmap</h3>
              <p className="text-sm text-gray-700 font-mono">Receive a week-by-week personalized roadmap that connects your purpose to practical learning milestones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white text-black">
        <div className=" px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-4xl font-sans tracking-tighter sm:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[900px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-mono">
                Everything you need to know about your self-discovery journey
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-3xl mt-12 space-y-4">
            {/* FAQ Item 1 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex justify-between items-center">
              <h3 className="font-serif text-lg">How long does the Ikigai mapping take?</h3>
              <ChevronDown className="h-5 w-5" />
            </div>
            {/* FAQ Item 2 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex justify-between items-center">
              <h3 className="font-serif text-lg">Can I change my module selection later?</h3>
              <ChevronDown className="h-5 w-5" />
            </div>
            {/* FAQ Item 3 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex justify-between items-center">
              <h3 className="font-serif text-lg">Is this mandatory for the cohort?</h3>
              <ChevronDown className="h-5 w-5" />
            </div>
            {/* FAQ Item 4 */}
            <div className="rounded-xl border bg-white p-6 shadow-sm flex justify-between items-center">
              <h3 className="font-serif text-lg">How is this different from career counseling?</h3>
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="font-mono relative w-full bg-white/80 text-black overflow-hidden blur-effect">
        <div className="relative  mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <Image src="/100xEngineers-black.svg" alt="100xEngineers Logo" width={200} height={40} className="mb-4" />
          <div className="w-48 h-px bg-black mb-8"></div>
          <nav className="flex flex-col justify-center items-center gap-8"> 
            <Link
              href="/ikigai"
              className="flex items-center text-base font-mono uppercase tracking-wide text-black"
            >
              Ikigai
            </Link>
            <Link
              href="/project-ideation"
              className="flex items-center text-base font-mono uppercase tracking-wide text-black"
              onClick={(e) => handleNavigation(e, "/project-ideation")}
            >
              Project Ideation
            </Link>
            <Link
              href="/cohort-roadmap"
              className="flex items-center text-base font-mono uppercase tracking-wide text-black"
              onClick={(e) => handleNavigation(e, "/cohort-roadmap")}
            >
              Cohort Roadmap
            </Link>
          </nav>
        </div>
        <div className="w-full" style={{marginTop:'-100px'}}>
          <Image
            src="/100x-footer.png"
            alt="100x Footer"
            width={1920}
            height={0}
            layout="responsive"
            objectFit="cover"
            className="w-full"
          />
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
