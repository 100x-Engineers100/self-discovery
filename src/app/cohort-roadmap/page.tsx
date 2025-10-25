"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface RoadmapItem {
  id: string;
  userId: string;
  session_name: string;
  week_number: number;
  lecture_number: number;
  module_name: string;
  project_based_msg: string;
  outcome_based_msg: string;
}

interface GroupedRoadmap {
  [module_name: string]: {
    [week_number: number]: {
      [session_name: string]: RoadmapItem[];
    };
  };
}

export default function CohortRoadmapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [roadmapData, setRoadmapData] = useState<RoadmapItem[]>([]);

  useEffect(() => {
    if (status === "loading") {
      return; // Do nothing while loading
    }

    if (!session) {
      router.push("/login");
    } else {
      setIsLoading(false);
      fetchRoadmap(session.user.id);
    }
  }, [session, status, router]);

  const fetchRoadmap = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/roadmaps?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRoadmapData(data);
      } else {
        console.error("Failed to fetch roadmap data");
      }
    } catch (error) {
      console.error("Error fetching roadmap data:", error);
    }
  };

  const groupRoadmap = (data: RoadmapItem[]): GroupedRoadmap => {
    return data.reduce((acc: GroupedRoadmap, item) => {
      if (!acc[item.module_name]) {
        acc[item.module_name] = {};
      }
      if (!acc[item.module_name][item.week_number]) {
        acc[item.module_name][item.week_number] = {};
      }
      if (!acc[item.module_name][item.week_number][item.session_name]) {
        acc[item.module_name][item.week_number][item.session_name] = [];
      }
      acc[item.module_name][item.week_number][item.session_name].push(item);
      return acc;
    }, {});
  };

  const groupedRoadmap = groupRoadmap(roadmapData);

  if (isLoading) {
    return <div>Loading Cohort Roadmap...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session?.user} activePath="/cohort-roadmap">
        <div className="flex-1 flex flex-col p-4 bg-white min-h-screen">
          <h1 className="text-3xl font-extrabold mb-6 text-[#ee593b]">Your Personalized Roadmap</h1>
          <div className="space-y-8">
            {Object.entries(groupedRoadmap).map(([module_name, weeks]) => (
              <div key={module_name} className="bg-[#ee593b] p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white">{module_name}</h2>
                {Object.entries(weeks).map(([week_number, sessions]) => (
                  <div key={week_number} className="ml-4 mt-4 border-l-2 border-white pl-4">
                    <h3 className="text-xl font-semibold mb-3 text-white">Week: {week_number}</h3>
                    {Object.entries(sessions).map(([session_name, items]) => (
                      <div key={session_name} className="ml-4 mt-3 border-l-2 border-white pl-4">
                        <h4 className="text-lg font-medium mb-2 text-white">Session: {session_name}</h4>
                        <ul className="list-inside space-y-1">
                          {items.map((item, index) => (
                            <li key={index} className="text-white">
                              <p className="font-semibold text-white">Outcome-based: <span className="font-normal">{item.outcome_based_msg}</span></p>
                              <p className="font-semibold text-white">Project-based: <span className="font-normal">{item.project_based_msg}</span></p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </AppSidebar>
    </SidebarProvider>
  );
}