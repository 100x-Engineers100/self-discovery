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
import { Button } from "@/components/ui/button";

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

interface IkigaiResponseItem {
  ikigai_details: IkigaiData | null;
  chat_history: ChatMessage[];
  chat_number: number;
}

const modules: ModuleContext[] = [
  {
    name: "Module 1: Diffusion Models",
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
    name: "Module 2: Full Stack Development",
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
    name: "Module 3: Large Language Models",
    description: "Foundations, advanced concepts, and implementation of LLMs.",
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
    name: "Module 4: AI Agents",
    description: "AI Agents, multi-agent systems, and production implementation.",
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
  if (ikigaiData && ikigaiData.status === 'complete') {
    ikigaiPrompt = `Mentee\'s Ikigai Data:\n  - What they love: ${ikigaiData.what_you_love}\n  - What they are good at: ${ikigaiData.what_you_are_good_at}\n  - What the world needs: ${ikigaiData.what_world_needs}\n  - What they can be paid for: ${ikigaiData.what_you_can_be_paid_for}`;
    ikigaiPrompt += `\n  - Your Ikigai: ${ikigaiData.your_ikigai}\n  - Explanation: ${ikigaiData.explanation}`;
  }

  const modulePrompt = `Module Context:\n  - Module Name: ${moduleContext.name}\n  - Description: ${moduleContext.description}\n  - Learning Outcomes: ${moduleContext.learningOutcomes.join(", ")}\n  - Topics Covered: ${moduleContext.topicsCovered.join(", ")}`;

  const samplesPrompt = samples.map((sample, index) => `Project Sample ${index + 1}:\n  - Title: ${sample.title}\n  - Problem Statement: ${sample.problemStatement}\n  - Solution: ${sample.solution}`).join("\n\n");

  return `${ikigaiPrompt}

${modulePrompt}

${samplesPrompt}

You are an AI mentor that helps a mentee ideate, refine, and evaluate practical project problem statements and MVP solutions tied to a learning module. Use the contextual inputs (Mentee Ikigai data if present, Module Context, and Project Samples) and any user-supplied idea to produce targeted, persona-aware, non-generic project proposals at two difficulty levels: easy and medium.

MANDATORY PRINCIPLES (must follow)
1. Grounding: Every claim, paraphrase, mapping, or example must be anchored to one of:
   a) Mentee's supplied project idea (highest priority)
   b) Mentee Ikigai data (if status === 'complete')
   c) Module Context (learning outcomes or topicsCovered)
   d) Provided Project Samples
   If none of the above contain usable anchors, ask one short clarifying question (see Clarifying section) instead of inventing details.

2. Persona-awareness: Derive a persona from available context (explicit role in ikigai or module or the user text). Personas include: fresher/student, developer, mid-level engineer, manager, founder, designer. Use persona to tailor required skills, examples, scope, and examples of users. If persona cannot be inferred, ask one short question: "Quick check: are you a student, developer, manager, founder, or designer?"

3. No force-fit / No generics: Do NOT output vague templates or generic “AI app” suggestions. Each problem statement must describe a specific target user and situation (who, what, where, why). Avoid grand claims; scope proposals to realistic MVPs with clear constraints.

OUTPUT STRUCTURE (required exact fields, in this order)
For each proposal produce this exact block (use short sentences / bullet-like lines):

1) Title: <<=6 words>

- Level: easy | medium

- Problem Statement: <1–2 sentences describing a specific user & real pain>

- Solution Summary: <1–2 sentences showing how the MVP solves it>

- Why this fits (rationale): <1–2 sentences mapping to Module Context learning outcome(s) (quote verbatim) and to Ikigai or Project Sample if applicable>

- Required skills: <3–6 short phrases (technical + soft)>

- Key features: <3–6 comma-separated feature phrases>

MANDATORY RULES FOR CONTENT QUALITY
• Provide at least two proposals: one "easy" and one "medium". Optionally one alternate variant only if it adds distinct value.
• For each proposal explicitly quote at least one Module Context learningOutcome or topicsCovered verbatim. Example: Covers: "Implement CRUD with REST".
• If ikigaiData exists, add one line in "Why this fits" like: "Maps to Ikigai: uses '<what_you_love>' + '<what_you_are_good_at>'".
• Each Problem Statement must specify who the user is (persona or target user), what they need, and why current alternatives fail at this scope.
• Medium-level project must include at least one non-trivial integration or algorithmic component (e.g., recommendation rule, basic ML prototype, data ingestion).
• Keep full reply proposing ideas <= 450 words. Use concise bullet-like lines; no long paragraphs.

WHEN USER GIVES AN IDEA
• Echo the mentee idea in one short sentence (quote their words).
• Then produce a refined Problem Statement and Solution Summary following the exact fields above.
• Provide 3–5 focused features.
• If a critical constraint is missing (deadline, target user, tech), ask ONE targeted clarifying question (one at a time) before finalizing additional proposals.

CLARIFYING QUESTIONS
• If anchors or persona are missing or context is ambiguous, ask a 1-sentence clarifying question instead of guessing. Example: "Quick check: is your project frontend-only or full-stack?"
• Only ask up to two clarifying questions (one at a time). Wait for user reply before proceeding.

SAVING BEHAVIOR (exact)
• If the mentee explicitly agrees to save an idea respond EXACTLY (no extra text):
  PROJECT_IDEA_AGREED_TO_SAVE: { "problemStatement": "...", "solution": "...", "features": "feature1, feature2, feature3" }

OFF-TOPIC HANDLING (exact)
• If the user asks something not related to project ideation, reply exactly:
  "I am here to help you with project ideation. Please focus on discussing your project ideas."
  Then re-ask the most recent ideation question or continue the current flow.

HONESTY & ASSUMPTIONS
• Never invent datasets, system availability, or credentials. If you assume a resource, flag it as: "(Assumption: ...)".
• If a feature needs a paid API or external dataset, list it once under Risks / Dependencies.

EXAMPLES & MAPPINGS (must include)
• For each proposal include a single explicit mapping line quoting at least one module learning outcome, e.g.:
  Covers: "Build and deploy a REST API" (from moduleContext.learningOutcomes)
• If ikigaiData.status === 'complete', include: Maps to Ikigai: uses "<what_you_love>" + "<what_you_are_good_at>"

VERBOSITY & STYLE
• Use simple, direct words. No marketing fluff.
• Use bullets and short sentences. Keep each field concise.
• Maximum reply length for a proposals output = 450 words.

FINAL QUALITY CHECKS (programmatic checks to enforce)
Before returning, ensure:
• There are exactly 2 required proposals (easy, medium) unless the user asked for more.
• Each proposal contains all required fields.
• Each proposal quotes a module learningOutcome verbatim.
• Each project has 3+ features.
• If any check fails, fallback to: ask one short clarifying question rather than returning partial generic ideas.

Use the ikigaiPrompt, modulePrompt, and samplesPrompt provided in context to tailor each proposal. Prioritize actionable learning value, realistic scope, and explicit mappings to module outcomes and mentee context.
`
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
  const [isRecharging, setIsRecharging] = useState(false);
  const [show0PercentWarning, setShow0PercentWarning] = useState(false);
  const [hasShown50PercentWarning, setHasShown50PercentWarning] = useState(false);
  const [hasShown20PercentWarning, setHasShown20PercentWarning] = useState(false);
  const [hasShown0PercentWarning, setHasShown0PercentWarning] = useState(false);
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
          const ikigaiResponses: IkigaiResponseItem[] = await response.json();
          const completedIkigai = ikigaiResponses.filter((item: IkigaiResponseItem) => item.ikigai_details && item.ikigai_details.status === 'complete');
          if (completedIkigai.length > 0) {
            const latestIkigai = completedIkigai.sort((a: IkigaiResponseItem, b: IkigaiResponseItem) => b.chat_number - a.chat_number)[0];
            setUserIkigaiData(latestIkigai.ikigai_details);
          } else {
            setUserIkigaiData(null);
          }
        } else {
          console.error("Failed to fetch user Ikigai data");
          setUserIkigaiData(null); 
        }
      } catch (error) {
        console.error("Error fetching user Ikigai data:", error);
        setUserIkigaiData(null); 
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
          menteeName: session.user.name, // Add mentee's name here
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
    console.log("1");
    
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

        console.log("userName", session.user.name);
        

      await fetch(`${process.env.NEXT_PUBLIC_SELF_DISCOVERY_API_BASE_URL}/api/project-ideation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name, // Add user's name here
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
        setIsLoading(false); 
      };
      fetchAllUserData();
    }
  }, [session, status, router, selectedModule]);

  useEffect(() => {
    const fiftyPercent = MAX_TOKENS_PER_MENTEE * 0.5;
    const twentyPercent = MAX_TOKENS_PER_MENTEE * 0.2;

    if (ideationBalance <= 0 && !hasShown0PercentWarning) {
      setShow0PercentWarning(true);
      setHasShown0PercentWarning(true);
    } else if (ideationBalance <= twentyPercent && ideationBalance > 0 && !hasShown20PercentWarning) {
      setShow20PercentWarning(true);
      setHasShown20PercentWarning(true);
    } else if (ideationBalance <= fiftyPercent && ideationBalance > twentyPercent && !hasShown50PercentWarning) {
      setShow50PercentWarning(true);
      setHasShown50PercentWarning(true);
    }
  }, [ideationBalance, MAX_TOKENS_PER_MENTEE, hasShown50PercentWarning, hasShown20PercentWarning, hasShown0PercentWarning]);

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
            <title className="font-mono">Project Ideation</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <h1 className="text-2xl font-bold mb-4 font-mono">Project Ideation</h1>

          {!selectedModule ? (
            <>
            <h2 className="text-xl font-bold tracking-tight font-mono">Select a module to ideate your project</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {modules.map((moduleContext) => (
                <Button
                  key={moduleContext.name}
                  variant="secondary"
                  onClick={() => setSelectedModule(moduleContext)}
                  className="cursor-pointer flex flex-col items-start p-4 h-auto text-left font-mono"
                >
                  <span className="text-[#FF6445] text-lg font-semibold">{moduleContext.name}</span>
                  <span className="text-sm text-foreground mt-1">
                    {moduleContext.description}
                  </span>
                </Button>
              ))}
            </div>
            </>
          ) : (
            <div className="w-full">
              <div className="flex justify-between items-center gap-4 pb-3">
                <div className="flex items-center gap-6"> 
                  <h2 className="text-xl font-bold font-mono">{selectedModule.name}</h2>
                  <button
                    className="px-2 py-1 bg-[#FF6445] text-md cursor-pointer text-white rounded hover:bg-[#d44a2f] font-mono"
                    onClick={() => setSelectedModule(null)}
                  >
                    Change Module
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-md font-mono">
                    Credits: <span className="text-orange-500 font-semibold">{(ideationBalance / 1000).toFixed(0)}</span>
                  </div>
                  {ideationBalance <= 0 && (
                    <Button
                      size="sm"
                      style={{backgroundColor:"#FF6445"}}
                      onClick={async () => {
                        setIsRecharging(true);
                        try {
                          await handleRequestRecharge();
                        } catch (error) {
                          console.error("Failed to send recharge request for Project Ideation:", error);
                        } finally {
                          setIsRecharging(false);
                        }
                      }}
                      className="bg-[#FF6445] text-white cursor-pointer hover:bg-[#d44a2f] p-2 rounded-md h-auto font-mono"
                      disabled={isRecharging}
                    >
                      {isRecharging ? "Requesting..." : "Request Recharge"}
                    </Button>
                  )}
                </div>
              </div>
              <DataStreamProvider>
                  <Chat
                    key={JSON.stringify(chatHistory)}
                    id="project-ideation"
                    userName={session?.user?.name || ""}
                    initialChatModel={DEFAULT_CHAT_MODEL}
                    initialMessages={chatHistory.length > 0 ? chatHistory : [
                      {
                        id: "1",
                        role: "assistant",
                        parts: [
                          {
                            type: "step-start",
                          },
                          {
                            type: "text",
                            text: `Hello! I\'m here to help you ideate project ideas for "${selectedModule.name}". You can either tell me your own project idea to refine, or ask me for suggestions based on the module\'s topics and your Ikigai data. How would you like to start?`,
                            state: "done"
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
                    setChatHistory={setChatHistory}
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
                <AlertDialogTitle className="font-mono">Ideation Balance Low</AlertDialogTitle>
                <AlertDialogDescription className="font-mono">
                  Your project ideation chat balance is at 50%. Please use your remaining tokens wisely.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShow50PercentWarning(false)} className="font-mono">OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 20% Balance Warning */}
          <AlertDialog open={show20PercentWarning} onOpenChange={setShow20PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-mono">Ideation Balance Critical</AlertDialogTitle>
                <AlertDialogDescription className="font-mono">
                  Your project ideation chat balance is at 20%. Please use your remaining tokens wisely.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShow20PercentWarning(false)} className="font-mono">OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 0% Balance Warning */}
          <AlertDialog open={show0PercentWarning} onOpenChange={setShow0PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-mono">Ideation Balance Empty</AlertDialogTitle>
                <AlertDialogDescription className="font-mono">
                  Your project ideation chat balance is at 0%. To continue using the chat, please click the &apos;Request Recharge&apos; button, and our 100x team will review your request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShow0PercentWarning(false)} className="font-mono">Close</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestRecharge} className="font-mono">
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
