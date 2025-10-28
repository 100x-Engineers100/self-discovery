"use client";

import { Chat } from "@/components/chat";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { generateUUID } from "@/lib/utils";
import { toast } from "@/components/toast";
import { DEFAULT_CHAT_MODEL } from "../../lib/ai/models";
import { IkigaiChartDisplay } from "@/components/ikigai-chart-display";
import { ChatMessage, ChatTools, CustomUIDataTypes, IkigaiData } from "@/lib/types";
import { Toaster } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UIMessagePart } from "ai";
import Spinner  from "@/components/ui/spinner";

async function saveIkigaiAnswers(userId: string, ikigaiDetails: IkigaiData, chatHistory: ChatMessage[]) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      ...ikigaiDetails,
      chat_history: chatHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save Ikigai answers: ${response.statusText}`);
  }

  return response.json();
}

function parseIkigaiResponse(text: string): IkigaiData | null {
  try {
    const summaryStartIndicator = "IKIGAI_FINAL_SUMMARY:";
    const summaryStartIndex = text.indexOf(summaryStartIndicator);
    if (summaryStartIndex === -1) return null;

    const jsonStartSearchIndex = summaryStartIndex + summaryStartIndicator.length;
    const jsonStartIndex = text.indexOf("{", jsonStartSearchIndex);
    if (jsonStartIndex === -1) return null;

    // Find the end of the JSON object, assuming it's followed by a natural language sentence.
    // This is a bit fragile and might need adjustment if the AI's output format changes again.
    const potentialJsonEndIndex = text.indexOf("}", jsonStartIndex);
    if (potentialJsonEndIndex === -1) return null;

    let jsonEndIndex = potentialJsonEndIndex;
    // Keep searching for the last '}' in case of nested objects
    let openBrackets = 0;
    for (let i = jsonStartIndex; i <= text.length; i++) {
      if (text[i] === '{') {
        openBrackets++;
      } else if (text[i] === '}') {
        openBrackets--;
      }
      if (openBrackets === 0 && i > jsonStartIndex) {
        jsonEndIndex = i;
        break;
      }
    }

    if (openBrackets !== 0) {
      console.error("Mismatched brackets in Ikigai JSON response.", text);
      return null;
    }

    let ikigaiJsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);

    // Robust regex to handle unquoted keys and values, and escape internal double quotes
    ikigaiJsonString = ikigaiJsonString.replace(/([{,])\s*([a-zA-Z0-9_]+):\s*([^,\}\]]*)/g, (match, p1, key, value) => {
      let processedValue = value.trim();
      // Escape internal double quotes in the value
      processedValue = processedValue.replace(/"/g, '\\"');

      // Only quote value if it's not already quoted, a number, boolean, or null
      if (!/^(".*"|true|false|null|-?\d+(\.\d+)?)$/.test(processedValue)) {
        processedValue = `"${processedValue}"`;
      }
      return `${p1}"${key}":${processedValue}`;
    });

    const parsedData = JSON.parse(ikigaiJsonString);
    // Basic validation to ensure it matches the IkigaiData structure
    if (
      typeof parsedData.what_you_love === 'string' &&
      typeof parsedData.what_you_are_good_at === 'string' &&
      typeof parsedData.what_world_needs === 'string' &&
      typeof parsedData.what_you_can_be_paid_for === 'string' &&
      typeof parsedData.your_ikigai === 'string' &&
      typeof parsedData.explanation === 'string' &&
      typeof parsedData.next_steps === 'string'
    ) {
      return parsedData as IkigaiData;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse Ikigai JSON response:", error);
    return null;
  }
}

export default function IkigaiPage() {
  const { data: session, status } = useSession();
  const [ikigaiFilled, setIkigaiFilled] = useState(false);
  const [showNewIkigaiWarning, setShowNewIkigaiWarning] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_CHAT_MODEL);
  const [ikigaiBalance, setIkigaiBalance] = useState<number>(15000);
  const [show50PercentWarning, setShow50PercentWarning] = useState(false);
  const [show20PercentWarning, setShow20PercentWarning] = useState(false);
  const [show0PercentWarning, setShow0PercentWarning] = useState(false);
  const [hasShownBalanceWarning, setHasShownBalanceWarning] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state

  const MAX_TOKENS_PER_MENTEE = 15000; // Define the max tokens here for percentage calculation

  const [ikigaiData, setIkigaiData] = useState<IkigaiData | null>(null);

  const fetchIkigaiBalance = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance?userId=${session.user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setIkigaiBalance(data.ikigai_balance);
        } else {
          console.error("Failed to fetch ikigai balance");
        }
      } catch (error) {
        console.error("Error fetching ikigai balance:", error);
      }
    }
  };

  const handleRequestRecharge = async (currentChatHistory: ChatMessage[]) => {
    if (!session?.user?.id) {
      toast({
        description: "User not authenticated.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/recharge-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menteeId: session.user.id,
          amount: 15000, // Hardcoded for ikigai_balance
          chatHistory: currentChatHistory,
          balanceType: "ikigai_balance", // Hardcoded for ikigai_balance
          menteeName: session.user.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create recharge request: ${response.statusText}`);
      }

      toast({
        description: `Your recharge request for Ikigai Balance has been sent.`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to process Ikigai response:", error);
      toast({
        description: "Failed to process your Ikigai. Please try again.",
        type: "error",
      });
    }
  };

  const handleChatFinish = async (text: string, messages: ChatMessage[]) => {
  // Format messages to ensure they match the required structure
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' } as UIMessagePart<CustomUIDataTypes, ChatTools>] 
  }));
  setChatHistory(formattedMessages);
  fetchIkigaiBalance();
    if (session?.user && text.includes("IKIGAI_FINAL_SUMMARY:")) {
      try {
        const parsedIkigaiData = parseIkigaiResponse(text);
        if (parsedIkigaiData) {
          // setIkigaiData(parsedIkigaiData);
          if (session?.user?.id) {
            const ikigaiDetails = parsedIkigaiData;
            
            await saveIkigaiAnswers(session.user.id, ikigaiDetails, messages);
            toast({
              description: "Your Ikigai chart has been saved.",
              type: "success",
            });
          }
        }
        toast({
          description: "Your Ikigai chart is ready. Click the button below to save it.",
          type: "success",
        });
      } catch (error) {
        console.error("Failed to process Ikigai response:", error);
        toast({
          description: "Failed to process your Ikigai. Please try again.",
          type: "error",
        });
      }
    } else if (session?.user && text.includes("Your Ikigai:")) {
      // This block might still be useful for displaying intermediate Ikigai summaries
      // but won't trigger saving to the database.
      try {
        const parsedIkigaiData = parseIkigaiResponse(text);
        if (parsedIkigaiData) {
          // setIkigaiData(parsedIkigaiData);
          toast({
            description: "Your Ikigai data has been successfully saved.",
            type: "success",
          });
        } 
      } catch (error) {
        console.error("Failed to parse Ikigai response:", error);
      }
    }
  };

  useEffect(() => {
    const fetchIkigaiStatus = async () => {
      if (session?.user) {
        setIsLoading(true); // Set loading to true before fetching
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data?.ikigai_details?.status === 'complete') {
              setIkigaiFilled(true);
              setIkigaiData(data.ikigai_details);
            } else {
              setIkigaiFilled(false);
              setIkigaiData(null);
              
              if (data.chat_history) {
                setChatHistory(data.chat_history);
              }
            }
          } else {
            console.error("Failed to fetch Ikigai status:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching Ikigai status:", error);
        } finally {
          setIsLoading(false); // Set loading to false after fetching (success or error)
        }
      }
    };
    fetchIkigaiStatus();
  }, [session]);

  useEffect(() => {
    fetchIkigaiBalance();
  }, [session, setIkigaiBalance]);

  useEffect(() => {
    if (ikigaiBalance > 0 && !hasShownBalanceWarning) { // Only show warnings if balance is not zero and not already shown
      const fiftyPercent = MAX_TOKENS_PER_MENTEE * 0.5;
      const twentyPercent = MAX_TOKENS_PER_MENTEE * 0.2;

      if (ikigaiBalance <= twentyPercent && ikigaiBalance > 0) {
        setShow20PercentWarning(true);
        setHasShownBalanceWarning(true);
      } else if (ikigaiBalance <= fiftyPercent && ikigaiBalance > twentyPercent) {
        setShow50PercentWarning(true);
        setHasShownBalanceWarning(true);
      }
    } else if (ikigaiBalance <= 0 && !hasShownBalanceWarning) {
      setShow0PercentWarning(true);
      setHasShownBalanceWarning(true);
    }
  }, [ikigaiBalance, MAX_TOKENS_PER_MENTEE, hasShownBalanceWarning]);

  if (status === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

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
        <p className="text-lg text-gray-500">Please log in to view your Ikigai chart.</p>
      </div>
    );
  }

  const handleNewIkigai = () => {
    setShowNewIkigaiWarning(true);
  };

  const confirmNewIkigai = async () => {
    if (session?.user) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai?userId=${session.user.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(`Failed to clear Ikigai data: ${response.statusText}`);
        }
        toast({
          description: "Your previous Ikigai data has been cleared.",
          type: "success",
        });
      } catch (error) {
        console.error("Error clearing Ikigai data:", error);
        toast({
          description: "Failed to clear previous Ikigai data. Please try again.",
          type: "error",
        });
      }
    }
    setIkigaiFilled(false);
    setShowNewIkigaiWarning(false);
    setIkigaiData(null);
  };

  return (
    <SidebarProvider>
      <AppSidebar user={session?.user} activePath="/ikigai">
        <div className="flex flex-col w-full h-screen p-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">Ikigai</div>
            <div className="text-sm text-gray-400">(Credits: {(ikigaiBalance/1000).toFixed(0)})</div>
          </div>
          {ikigaiFilled && ikigaiData ? (
            <div className="flex-grow flex flex-col items-center justify-center">
              <IkigaiChartDisplay ikigaiData={ikigaiData} />
              <Button onClick={handleNewIkigai} className="mt-4">Chat for new Ikigai</Button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col">
              <div className="flex-grow overflow-y-auto">
                <DataStreamProvider>
                  <Chat
                    id="ikigai-chat"
                    initialMessages={chatHistory.length > 0 ? chatHistory : [
                      {
                        id: "1",
                        role: "assistant",
                        parts: [
                          {
                            type: "step-start"
                          },
                          {
                            type: "text",
                            text: "Hello! I'm here to help you discover your Ikigai. Let's start with the first element: **What do you love?** Please share your passions, hobbies, and activities that bring you joy and energy. Think about what truly excites you and makes you lose track of time.",
                            state: "done"
                          },
                        ],
                      },
                    ]}
                    initialChatModel={selectedModelId}
                    initialVisibilityType="private"
                    isReadonly={false}
                    autoResume={false}
                    isIkigaiChat={true}
                    saveIkigaiAnswers={saveIkigaiAnswers}
                    onChatFinish={handleChatFinish}
                    userId={session?.user?.id || ""}
                    balance={ikigaiBalance}
                    setBalance={setIkigaiBalance}
                    disabled={ikigaiBalance <= 0}
                  />
                </DataStreamProvider>
              </div>
            </div>
          )}

          <AlertDialog open={showNewIkigaiWarning} onOpenChange={setShowNewIkigaiWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Ikigai Chart?</AlertDialogTitle>
                <AlertDialogDescription>
                  Creating a new Ikigai chart will overwrite your previous data. This newly filled Ikigai chart details will be used to create roadmaps & ideate problem statements accordingly.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmNewIkigai}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 50% Balance Warning */}
          <AlertDialog open={show50PercentWarning} onOpenChange={setShow50PercentWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ikigai Balance Low</AlertDialogTitle>
                <AlertDialogDescription>
                  Your ikigai chat balance is at 50%. 
                  Please use your remaining credits wisely.
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
                <AlertDialogTitle>Ikigai Balance Critical</AlertDialogTitle>
                <AlertDialogDescription>
                  Your ikigai chat balance is at 20%. 
                  Please use your remaining credits wisely.
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
                <AlertDialogTitle>Ikigai Balance Empty</AlertDialogTitle>
                <AlertDialogDescription>
                  All of your credits are exhausted. 
                  To continue using the chat, please click the &apos;Request Recharge&apos; button, and our 100x team will review your request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShow0PercentWarning(false)}>Close</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRequestRecharge(chatHistory)}>
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