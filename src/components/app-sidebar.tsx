"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { format } from "date-fns";
import { IkigaiApiResponse } from "@/lib/types";

interface AppSidebarProps {
  children: React.ReactNode;
  activePath: string; // Add activePath prop
  user: User | undefined; // Add user prop
  chatNumber?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AppSidebar({ children, activePath, user, chatNumber }: AppSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const handleNewChat = async () => {
    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          chat_history: [],
          what_you_love: "",
          what_you_are_good_at: "",
          what_world_needs: "",
          what_you_can_be_paid_for: "",
          your_ikigai: "",
          explanation: "",
          next_steps: "",
          status: "ongoing",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new chat");
      }

      const data = await response.json();
      const newChatNumber = data.chat_number; // Changed from data.newChatNumber to data.chatNumber

      if (newChatNumber) {
        mutate(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${user.id}`);
        router.push(`/ikigai?chatNumber=${newChatNumber}`);
        setOpenMobile(false);
      } else {
        toast.error("Failed to get new chat number.");
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat.");
    }
  };

  const { data: ikigaiDataList, error: ikigaiError, isLoading: isIkigaiDataLoading } = useSWR(
    user ? `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${user.id}` : null,
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
      setOpenMobile(false);
      return;
    }
    
    if (!isIkigaiComplete && (path === "/project-ideation" || path === "/cohort-roadmap")) {
      e.preventDefault();
      // toast.error("Please complete your Ikigai chart first to access this page.");
      toast.error("Coming soon!");
      setOpenMobile(false);
      return;
    }
    setOpenMobile(false);
  };

  const handleDeleteAll = () => {
    // Removed history API call
    toast.promise(Promise.resolve(), {
      // loading: "Deleting all chats...in progress",
      success: () => {
        router.push("/");
        setShowDeleteAllDialog(false);
        return "All chats deleted successfully";
      },
      error: "Failed to delete all chats",
    });
  };

  return (
    <div className="flex w-full h-full">
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-3"
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <span className="cursor-pointer rounded-md p-2 font-semibold text-lg hover:bg-muted">
                  <img src="/100xEngineers-black.svg" alt="100xEngineers" className="h-6 w-auto" />
                </span>
              </Link>
              {/* <div className="flex flex-row gap-1">
                {user && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2"
                        onClick={() => setShowDeleteAllDialog(true)}
                        type="button"
                        variant="ghost"
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      Delete All Chats
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/");
                        router.refresh();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div> */}
            </div>
            {user && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="border-b border-black"></div>
                <Link
                  className={cn(
                    "flex flex-row items-center gap-3 rounded-md px-2 py-1 font-semibold text-lg",
                    activePath === "/ikigai" ? "bg-[#FF6445] text-white" : "text-black bg-gray-200"
                  )}
                  href={latestIkigaiData ? `/ikigai?chatNumber=${latestIkigaiData.chat_number}` : "/ikigai"}
                  onClick={() => setOpenMobile(false)}
                >
                  Ikigai
                </Link>
                {activePath === "/ikigai" && (
                  <div className="flex flex-col gap-2 pl-4">
                    <Button
                      className="cursor-pointer w-auto h-auto flex items-center gap-3 rounded-md p-1 font-semibold text-md bg-[#FF6445] text-white hover:bg-[#FF4B3A]"
                      onClick={handleNewChat}
                    >
                      <PlusIcon size={16} /> New Chat
                    </Button>
                    <h3 className="text-sm font-semibold text-gray-500 mt-2">Chats</h3>
                    <div className="flex flex-col gap-1">
                      {ikigaiDataList && ikigaiDataList.length > 0 ? (
                        ikigaiDataList
                          .sort((a: IkigaiApiResponse, b: IkigaiApiResponse) => b.chat_number - a.chat_number) // Sort by latest chat_number first
                          .map((chat: IkigaiApiResponse, index: number) => (
                            <Link
                              key={chat.chat_number || index}
                              href={`/ikigai?chatNumber=${chat.chat_number}`}
                              onClick={() => setOpenMobile(false)}
                              className={cn(
                                "text-sm text-gray-700 hover:text-gray-900 p-2 rounded-md",
                                chat.chat_number === chatNumber && "bg-gray-300 text-black"
                              )}
                            >
                              Chat {chat.chat_number} - {format(new Date(chat.created_at || Date.now()), "MMM d, yyyy")}
                            </Link>
                          ))
                      ) : (
                        <div className="text-sm text-gray-700 p-2">No chats yet.</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="border-b border-black pb-2 mb-2"></div>
                <Link
                  className={cn(
                    "flex flex-row items-center gap-3 rounded-md px-2 py-1 font-semibold text-lg",
                    activePath === "/project-ideation" ? "bg-[#FF6445] text-white" : "text-black bg-gray-200"
                  )}
                  href="/project-ideation"
                  onClick={(e) => handleNavigation(e, "/project-ideation")}
                >
                  Project Ideation
                </Link>
                <div className="border-b border-black pb-2 mb-2"></div>
                <Link
                  className={cn(
                    "flex flex-row items-center gap-3 rounded-md px-2 py-1 font-semibold text-lg",
                    activePath === "/cohort-roadmap" ? "bg-[#FF6445] text-white" : "text-black bg-gray-200"
                  )}
                  href="/cohort-roadmap"
                  onClick={(e) => handleNavigation(e, "/cohort-roadmap")}
                >
                  Cohort Roadmap
                </Link>
              </div>
            )}
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* <SidebarHistory user={user} /> */}
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        {children}
      </div>

      <AlertDialog onOpenChange={setShowDeleteAllDialog} open={showDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your
              chats and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
