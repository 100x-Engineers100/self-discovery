"use client";

import { Chat } from "@/components/chat";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { DEFAULT_CHAT_MODEL } from "../../lib/ai/models";
import Head from "next/head";
import Spinner from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/toast";
import { Toaster } from "sonner";
import { ChatMessage } from "@/lib/types";

interface ModuleContext {
  name: string;
  description: string;
  learningOutcomes: string[];
  topicsCovered: string[];
  balanceType: string;
}

interface ProjectSample {
  title: string;
  problemStatement: string;
  solution: string;
}

const modules: ModuleContext[] = [
  {
    name: "Module 1: Diffusion Models (Weeks 1-6)",
    description: "Learn about Diffusion Models and their applications.",
    learningOutcomes: [
      "Understanding of GenAI Landscape and fundamentals",
      "Grasp of diffusion model principles",
      "Ability to generate basic images with SDXL",
      "Mastery of prompt crafting for desired outputs",
      "Advanced image manipulation skills",
      "Ability to create AI animations",
      "Advanced style manipulation capabilities",
      "Comprehensive feature integration skills",
      "Ability to train custom models",
      "Custom model enhancement skills",
      "Production-ready workflow creation",
      "Enterprise-Level implementation skill",
    ],
    topicsCovered: [
      "Evolution of GenAI, key milestones, research methodologies",
      "How diffusion models work, base concepts",
      "SDXL architecture, basic implementations",
      "Prompt engineering for SDXL",
      "Guided image generation, targeted editing",
      "AnimateDiff implementation, motion generation",
      "Style transfer workflows, creative outputs",
      "LipSyncing, Roop integration",
      "Custom model training, personalization",
      "LoRA implementation and optimization",
      "ComfyUI with Flux, scaling solutions",
      "Meta's Segment Anything, advanced features",
    ],
    balanceType: "ideation_balance_1",
  },
  {
    name: "Module 2: Full Stack Development (Weeks 7-12)",
    description: "Learn full-stack development with a focus on AI applications.",
    learningOutcomes: [
      "Strong programming foundation",
      "Efficient development environment",
      "Basic UI development skills",
      "Functional UI creation ability",
      "Rapid UI development capabilities",
      "Modern framework proficiency",
      "Understanding of API development",
      "Complete API development skills",
      "FastAPI development proficiency",
      "Production-ready API skills",
      "Full stack implementation ability",
      "Production deployment skills",
    ],
    topicsCovered: [
      "Programming fundamentals, AI tech stack",
      "Setup and tooling",
      "UI types, ChatGPT UI analysis",
      "Python-based UI development",
      "v0 implementation, AI-assisted development",
      "React.js, Next.js fundamentals",
      "API principles, architecture, design",
      "API testing, documentation, integration",
      "FastAPI, CRUD operations",
      "Documentation, testing, deployment",
      "Frontend-backend integration, AI models",
      "Serverless deployment, optimization",
    ],
    balanceType: "ideation_balance_2",
  },
  {
    name: "Module 3: Large Language Models (Weeks 13-18)",
    description: "Explore the foundations, advanced concepts, and implementation of Large Language Models.",
    learningOutcomes: [
      "Understanding of LLM ecosystem",
      "Basic LLM implementation skills",
      "Deep LLM understanding",
      "Expert prompt engineering skills",
      "Advanced integration capabilities",
      "LangChain implementation skills",
      "Open-source AI proficiency",
      "Project development skills",
      "RAG implementation ability",
      "Advanced RAG proficiency",
      "Basic fine-tuning ability",
      "Expert fine-tuning skills",
      "Architecture design skills",
      "Production readiness",
    ],
    topicsCovered: [
      "AI, ML, and deep learning fundamentals",
      "Basic LLM integration",
      "LLM architecture, capabilities, limitations",
      "Advanced prompting techniques",
      "Tool integration, external connections",
      "LangChain architecture, components",
      "Model hub, datasets, tools",
      "Project ideation, planning, execution",
      "RAG architecture, vector embeddings",
      "Complex RAG implementations",
      "Model fine-tuning basics",
      "PEFT, optimization techniques",
      "System design, scalability",
      "Production implementation",
    ],
    balanceType: "ideation_balance_3",
  },
  {
    name: "Module 4: AI Agents (Weeks 19-22)",
    description: "Delve into AI Agents, multi-agent systems, and their production implementation.",
    learningOutcomes: [
      "Understanding of agent architecture",
      "Basic agent implementation skills",
      "Multi-agent development skills",
      "Sophisticated agent development",
      "Agentic RAG implementation",
      "Expert implementation skills",
      "Practical implementation insights",
      "Production deployment skills",
      "Project implementation progress",
      "Production-ready AI implementation",
    ],
    topicsCovered: [
      "Agent fundamentals, design patterns",
      "Building agent frameworks",
      "Multi-agent systems, coordination",
      "Complex agent interactions",
      "RAG in agent systems",
      "Complex integrations, optimization",
      "Real-world implementations",
      "Production considerations",
      "Individual/team project development",
      "Final development, testing, documentation",
    ],
    balanceType: "ideation_balance_4",
  },
];

interface IkigaiData {
  what_you_love: string;
  what_you_are_good_at: string;
  what_world_needs: string;
  what_you_can_be_paid_for: string;
  status: string;
  your_ikigai: string;
  explanation: string;
}

const generateSystemPrompt = (ikigaiData: IkigaiData | null, moduleContext: ModuleContext, samples: ProjectSample[]): string => {  
  let ikigaiPrompt = "";
  if (ikigaiData) {
    ikigaiPrompt = `Mentee\'s Ikigai Data:\n  - What they love: ${ikigaiData.what_you_love}\n  - What they are good at: ${ikigaiData.what_you_are_good_at}\n  - What the world needs: ${ikigaiData.what_world_needs}\n  - What they can be paid for: ${ikigaiData.what_you_can_be_paid_for}`;

    if (ikigaiData.status === 'complete') {
      ikigaiPrompt += `\n  - Your Ikigai: ${ikigaiData.your_ikigai}\n  - Explanation: ${ikigaiData.explanation}`;
    }
  }

  const modulePrompt = `Module Context:\n  - Module Name: ${moduleContext.name}\n  - Description: ${moduleContext.description}\n  - Learning Outcomes: ${moduleContext.learningOutcomes.join(", ")}\n  - Topics Covered: ${moduleContext.topicsCovered.join(", ")}`;

  const samplesPrompt = samples.map((sample, index) => `Project Sample ${index + 1}:\n  - Title: ${sample.title}\n  - Problem Statement: ${sample.problemStatement}\n  - Solution: ${sample.solution}`).join("\n\n");

  return `You are an AI assistant helping a mentee ideate a project problem statement and solution. The mentee might provide their own ideas, and your role is to help them refine and update those ideas, ensuring they are concise, clear, and address a real-world need. You should also help them define a list of features for the project. If the mentee agrees to save a project idea, you MUST respond with the keyword PROJECT_IDEA_AGREED_TO_SAVE followed by a JSON object containing the problemStatement, solution, and a comma-separated string of features. For example: PROJECT_IDEA_AGREED_TO_SAVE: { "problemStatement": "...", "solution": "...", "features": "feature1, feature2, feature3" }`
};

const projectSamples: ProjectSample[] = [
  {
    title: "AI-Powered Study Buddy",
    problemStatement: "Students struggle with personalized learning experiences and efficient study techniques. They often get stuck on concepts, lack motivation, and find it hard to track their progress effectively.",
    solution: "Develop an AI-powered study buddy application that provides personalized learning paths, intelligent Q&A, progress tracking, and motivational support. The AI can adapt to the student\'s learning style, identify areas of weakness, and suggest relevant resources.",
  },
  {
    title: "Smart Home Energy Optimizer",
    problemStatement: "Homeowners face challenges in managing their energy consumption efficiently, leading to high utility bills and environmental impact. Existing smart home systems often lack comprehensive optimization capabilities.",
    solution: "Create a smart home energy optimization system that uses machine learning to analyze energy usage patterns, predict future consumption, and automatically adjust smart devices (thermostats, lights, appliances) to minimize energy waste while maintaining comfort. It could also provide users with detailed insights and recommendations.",
  },
];

export default function ProjectIdeationPage() {
  const [projectIdeationFilled, setProjectIdeationFilled] = useState(false); // TODO: This will eventually come from user data/backend state
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleContext | null>(null);
  const [userIkigaiData, setUserIkigaiData] = useState<IkigaiData | null>(null);
  const [ideationBalance, setIdeationBalance] = useState<number>(60000);
  const [show50PercentWarning, setShow50PercentWarning] = useState(false);
  const [show20PercentWarning, setShow20PercentWarning] = useState(false);
  const [show0PercentWarning, setShow0PercentWarning] = useState(false);
  const [hasShownBalanceWarning, setHasShownBalanceWarning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const MAX_TOKENS_PER_MENTEE = 15000; // Define the max tokens here for percentage calculation

  const fetchIdeationBalance = async (balanceType: string) => {
    if (session?.user?.id) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ideation-balance?userId=${session.user.id}&balanceType=${balanceType}`
        );
        if (response.ok) {
          const data = await response.json();
          setIdeationBalance(data.ideation_balance);
        } else {
          console.error("Failed to fetch ideation balance");
        }
      } catch (error) {
        console.error("Error fetching ideation balance:", error);
      }
    }
  };

  const fetchUserIkigaiData = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${session.user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setUserIkigaiData(data);
        } else {
          console.error("Failed to fetch user Ikigai data");
          setUserIkigaiData(null); // Ensure it's null on error
        }
      } catch (error) {
        console.error("Error fetching user Ikigai data:", error);
        setUserIkigaiData(null); // Ensure it's null on error
      }
    }
  };



  const handleRequestRecharge = async () => {
    if (!session?.user?.id) {
      toast({
        description: "User not authenticated.",
        type: "error",
      });
      return;
    }

    if (!selectedModule) {
      toast({
        description: "No module selected for recharge request.",
        type: "error",
      });
      return;
    }

    const balanceType = selectedModule.balanceType;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/recharge-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menteeId: session.user.id,
          amount: 40000, // Hardcoded for ideation_balance
          chatHistory: chatHistory,
          balanceType: balanceType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create recharge request: ${response.statusText}`);
      }

      toast({
        description: `Your recharge request for ${balanceType} has been sent.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to process recharge request:", error);
      toast({
        description: "Failed to send recharge request. Please try again.",
        type: "error",
      });
    }
  };

  const [projectIdeaId, setProjectIdeaId] = useState<string | null>(null);

  const handleChatFinish = async (text: string, messages: ChatMessage[]) => {
    fetchIdeationBalance(selectedModule?.name || '');
    setProjectIdeationFilled(true);
    setChatHistory(messages);
    if (session?.user?.id && selectedModule?.name) {
      const chatHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role,
          parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' }] // Adjust based on actual message structure
        }));
      await fetch(`${process.env.NEXT_PUBLIC_SELF_DISCOVERY_API_BASE_URL}/api/project-ideation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          moduleName: selectedModule.name,
          chatHistory: chatHistory,
        })
      });
    }
    toast({
      description: "Your project idea has been successfully generated.",
      type: "success",
    });
  };


  useEffect(() => {
    if (status === "loading") {
      return; // Do nothing while loading
    }

    if (!session) {
      router.push("/login");
    } else {
      const fetchAllUserData = async () => {
        setIsLoading(true); // Set loading to true while fetching
        if (session.user?.id) {
          if (selectedModule) { // Only fetch ideation balance if a module is selected
            // Determine balanceType based on selectedModule
            await fetchIdeationBalance(selectedModule.balanceType);

            // Fetch chat history for the selected module
            try {
              const response = await fetch(
                `/api/project-ideation?userId=${session.user.id}&moduleName=${selectedModule.name}`
              );
              if (response.ok) {
                const data = await response.json();
                setChatHistory(data.chat_history || []);
              } else {
                console.error("Failed to fetch project ideation chat history");
                setChatHistory([]);
              }
            } catch (error) {
              console.error("Error fetching project ideation chat history:", error);
              setChatHistory([]);
            }
          }
          await fetchUserIkigaiData();
        }
        setIsLoading(false); // Set loading to false after all data is fetched
      };
      fetchAllUserData();
    }
  }, [session, status, router, selectedModule]);

  useEffect(() => {
    if (ideationBalance > 0 && !hasShownBalanceWarning) { // Only show warnings if balance is not zero and not already shown
      const fiftyPercent = MAX_TOKENS_PER_MENTEE * 0.5;
      const twentyPercent = MAX_TOKENS_PER_MENTEE * 0.2;

      if (ideationBalance <= twentyPercent && ideationBalance > 0) {
        setShow20PercentWarning(true);
        setHasShownBalanceWarning(true);
      } else if (ideationBalance <= fiftyPercent && ideationBalance > twentyPercent) {
        setShow50PercentWarning(true);
        setHasShownBalanceWarning(true);
      }
    } else if (ideationBalance <= 0 && !hasShownBalanceWarning) {
      setShow0PercentWarning(true);
      setHasShownBalanceWarning(true);
    }
  }, [ideationBalance, MAX_TOKENS_PER_MENTEE, hasShownBalanceWarning]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-lg text-gray-500">Please log in to view your Project Ideation.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session?.user} activePath="/project-ideation">
        <div className="flex flex-col w-full h-screen p-4 overflow-hidden">
          <Head>
            <title>Project Ideation</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <h1 className="text-2xl font-bold mb-4">Project Ideation</h1>

          {!selectedModule ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedModule(module)}
                >
                  <h2 className="text-xl font-semibold">{module.name}</h2>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-4">Selected Module: {selectedModule.name}</h2>
              <button
                className="mb-4 px-4 py-2 bg-[#FF6445] text-white rounded hover:bg-[#d44a2f]"
                onClick={() => setSelectedModule(null)}
              >
                Change Module
              </button>
              <p className="text-lg text-gray-500 mb-4">Start ideating! <span className="text-sm text-gray-400">(Credits: {(ideationBalance/1000).toFixed(0)})</span></p>
                <DataStreamProvider>
                  <Chat
                    id="project-ideation"
                    initialChatModel={DEFAULT_CHAT_MODEL}
                    initialMessages={chatHistory.length > 0 ? chatHistory : [
                      {
                        id: "1",
                        role: "assistant",
                        parts: [
                          {
                            type: "text",
                            text: `Hello! I'm here to help you ideate project ideas for "${selectedModule.name}". You can either tell me your own project idea to refine, or ask me for suggestions based on the module's topics and your Ikigai data. How would you like to start?`,
                          },
                        ],
                      },
                    ]}
                    initialVisibilityType="private"
                    isReadonly={false}
                    autoResume={false}
                    api="/api/project-ideation"
                    onChatFinish={handleChatFinish}
                    systemPrompt={generateSystemPrompt(userIkigaiData, selectedModule, projectSamples)}
                    userId={session?.user?.id || ""}
                    balance={ideationBalance}
                    setBalance={setIdeationBalance}
                    moduleContext={selectedModule}
                    userIkigaiData={userIkigaiData}
                    disabled={ideationBalance <= 0}
                  />
                </DataStreamProvider>
            </div>
          )}

          {/* 50% Balance Warning */}
          <AlertDialog open={show50PercentWarning} onOpenChange={setShow50PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ideation Balance Low</AlertDialogTitle>
                <AlertDialogDescription>
                  Your project ideation chat balance is at 50%. Please use your remaining tokens wisely.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShow50PercentWarning(false)}>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 20% Balance Warning */}
          <AlertDialog open={show20PercentWarning} onOpenChange={setShow20PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ideation Balance Critical</AlertDialogTitle>
                <AlertDialogDescription>
                  Your project ideation chat balance is at 20%. Please use your remaining tokens wisely.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShow20PercentWarning(false)}>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 0% Balance Warning */}
          <AlertDialog open={show0PercentWarning} onOpenChange={setShow0PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ideation Balance Empty</AlertDialogTitle>
                <AlertDialogDescription>
                  Your project ideation chat balance is at 0%. To continue using the chat, please click the &apos;Request Recharge&apos; button, and our 100x team will review your request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShow0PercentWarning(false)}>Close</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestRecharge}>
                  Request Recharge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Toaster />
        </div>
      </AppSidebar>
    </SidebarProvider>
  );
}
