"use client";

import { useChat } from "@ai-sdk/react";
import { convertToModelMessages, DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage, TextUIPart, CustomUIDataTypes, MessageMetadata, AppUsage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { DataStreamProvider, useDataStream } from "./data-stream-provider";
import { DataStreamHandler } from "./data-stream-handler";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

import type { VisibilityType } from "./visibility-selector";
import { toast } from "./toast";
import type { IkigaiData } from "@/lib/types";
import { useSession } from "next-auth/react";
import { ChatHeader } from "./chat-header";
import type { Vote } from "@/lib/db/frontend-types";

export const MAX_TOKENS_PER_MENTEE = 15000;
export const CREDIT_CONVERSION_RATE = 1000; // 1 credit = 1000 tokens

export type ChatProps = {
  id: string;
  userName?: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
  isIkigaiChat?: boolean;
  saveIkigaiAnswers?: (userId: string, chat_number: number, ikigaiData: IkigaiData, messages: ChatMessage[]) => Promise<void>;
  onChatFinish?: (text: string, messages: ChatMessage[]) => Promise<void>;
  userId?: string;
  balance: number;
  setBalance: (balance: number) => void;
  setChatHistory: (messages: ChatMessage[]) => void;
  moduleContext?: { balanceType?: string; name?: string };
  userIkigaiData?: unknown;
  api?: string; // Add api prop
  systemPrompt?: string;
  balanceType?: string; // Add balanceType prop
  hideModelAndAttachments?: boolean; // New prop to hide model selection and attachments
  disabled?: boolean; // Add disabled prop
  chatNumber?: number; // Add chatNumber prop
};

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
  isIkigaiChat,
  saveIkigaiAnswers,
  onChatFinish,
  userId,
  userName,
  balance,
  setBalance,
  api = "/api/chat", // Default to /api/chat
  systemPrompt,
  moduleContext,
  setChatHistory,
  userIkigaiData,
  balanceType,
  disabled, // Add disabled prop
  hideModelAndAttachments, // Destructure the new prop
  chatNumber, // Destructure chatNumber prop
}: ChatProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // const { isChatPage } = useChatVisibility();

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  type TokenUsage = { promptTokens?: number; completionTokens?: number; totalTokens?: number };
const [currentInteractionTokens, setCurrentInteractionTokens] = useState<AppUsage | undefined>(undefined);
  const [cumulativeTokens, setCumulativeTokens] = useState<number>(0);
  const remainingCredits = balance !== null ? balance - (cumulativeTokens / CREDIT_CONVERSION_RATE) : 0;

  const [currentChatNumber, setCurrentChatNumber] = useState<number | undefined>(chatNumber);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  useEffect(() => {    
    setMessages(initialMessages);
  }, [initialMessages]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    // onResponse: (response) => {
    //   const promptTokens = response.headers.get("X-Prompt-Tokens");
    //   const completionTokens = response.headers.get("X-Completion-Tokens");
    //   const totalTokens = response.headers.get("X-Total-Tokens");

    //   if (promptTokens || completionTokens || totalTokens) {
    //     const currentPromptTokens = parseInt(promptTokens || "0", 10);
    //     const currentCompletionTokens = parseInt(completionTokens || "0", 10);
    //     const currentTotalTokens = parseInt(totalTokens || "0", 10);

    //     setCurrentInteractionTokens({
    //       promptTokens: currentPromptTokens,
    //       completionTokens: currentCompletionTokens,
    //       totalTokens: currentTotalTokens,
    //     });

    //     setCumulativeTokens((prevCumulativeTokens) => {
    //       const newCumulativeTokens = prevCumulativeTokens + currentPromptTokens + currentCompletionTokens;
    //       const updatedBalance = balance - (newCumulativeTokens / CREDIT_CONVERSION_RATE);
    //       setBalance(updatedBalance);

    //       // Persist the updated balance to the database
    //       if (currentUserId) {
    //         let balanceUpdatePromise;
    //         if (isIkigaiChat) {
    //           balanceUpdatePromise = fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance`, {
    //             method: 'POST',
    //             headers: {
    //               'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ userId: currentUserId, amount: updatedBalance }),
    //           });
    //         } else if (moduleContext?.balanceType) {
    //           balanceUpdatePromise = fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ideation-balance`, {
    //             method: 'PUT',
    //             headers: {
    //               'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ userId: currentUserId, amount: updatedBalance, balanceType: moduleContext.balanceType }),
    //           });
    //         }

    //         if (balanceUpdatePromise) {
    //           balanceUpdatePromise.then(response => {
    //             if (!response.ok) {
    //               console.error('Failed to update balance in DB');
    //             }
    //           }).catch(error => {
    //             console.error('Error updating balance in DB:', error);
    //           });
    //         }
            
    //         // Save Ikigai chat data when credits are exhausted (balance <= 0)
    //         if (isIkigaiChat) {
              
    //           const chatHistory = messages
    //             .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    //             .map(msg => ({
    //               id: generateUUID(), // Add a unique ID
    //               role: msg.role,
    //               parts: Array.isArray(msg.parts) ? msg.parts : [{ type: "text", text: "" }], // Ensure content is always a string
    //             }));
              
              
    //        fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       userId: currentUserId,
    //       chat_history: chatHistory,
    //       status: 'ongoing'
    //     }),
    //   }).catch(error => {
    //     console.error('Error saving chat history:', error);
    //   });
    //         }
    //       }

    //       return newCumulativeTokens;
    //     });
    //   }
    // },
    transport: new DefaultChatTransport({
      api: api,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        
        return {
          body: {
            messages: convertToModelMessages(request.messages),
            selectedChatModel: currentModelIdRef.current,
            isIkigaiChat: isIkigaiChat,
            userId: currentUserId,
            systemPrompt: systemPrompt,
            moduleContext: moduleContext,
            userIkigaiData: userIkigaiData,
            chat_number: currentChatNumber, // Pass the current chat number
            // chatHistory: request.messages, // Pass the full messages array as chatHistory
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));

      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },

    onFinish: async ({ message, messages }) => {
      // Token usage and balance update logic
      const { promptTokens, completionTokens, totalTokens } = message?.metadata?.usage || {};

      if (promptTokens || completionTokens || totalTokens) {
        const currentPromptTokens = promptTokens || 0;
        const currentCompletionTokens = completionTokens || 0;
        const currentTotalTokens = totalTokens || 0;

        setCurrentInteractionTokens({
          promptTokens: currentPromptTokens,
          completionTokens: currentCompletionTokens,
          totalTokens: currentTotalTokens,
          tokenCount: currentTotalTokens,
          cost: currentTotalTokens / CREDIT_CONVERSION_RATE,
        });

        setCumulativeTokens((prevCumulativeTokens) => {
          const newCumulativeTokens = prevCumulativeTokens + currentPromptTokens + currentCompletionTokens;
          const updatedBalance = balance - (newCumulativeTokens / CREDIT_CONVERSION_RATE);
          setBalance(updatedBalance);

          // Persist the updated balance to the database
          if (currentUserId) {
            let balanceUpdatePromise;
            if (isIkigaiChat) {
              balanceUpdatePromise = fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: currentUserId, amount: updatedBalance }),
              });
            } else if (moduleContext?.balanceType) {
              balanceUpdatePromise = fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ideation-balance`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: currentUserId, amount: updatedBalance, balanceType: moduleContext.balanceType }),
              });
            }

            if (balanceUpdatePromise) {
              balanceUpdatePromise.then(response => {
                if (!response.ok) {
                  console.error('Failed to update balance in DB');
                }
              }).catch(error => {
                console.error('Error updating balance in DB:', error);
              });
            }

            // Save Ikigai chat data when credits are exhausted (balance <= 0)
            if (isIkigaiChat) {
              const chatHistory = messages
                .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                .map(msg => ({
                  id: generateUUID(), // Add a unique ID
                  role: msg.role,
                  parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' } as TextUIPart]
                }));

              setChatHistory(chatHistory);

              fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: currentUserId,
                  chat_history: chatHistory,
                  status: 'ongoing',
                  chat_number: currentChatNumber, // Pass currentChatNumber for ongoing chats
                }),
              }).catch(error => {
                console.error('Error saving chat history:', error);
              });
            }
          }

          return newCumulativeTokens;
        });
      }

      // Original onFinish logic
      if (!message || !message.parts) {
        console.error("onFinish callback: message or message.parts is undefined.", message);
        return;
      }

      let fullText = "";
      for (const part of message.parts) {
        if (part.type === "text") {
          fullText += part.text;
        }
      }

      if (isIkigaiChat) {
        try {
          if(fullText.includes("IKIGAI_FINAL_SUMMARY:")){
const summaryStartIndicator = "IKIGAI_FINAL_SUMMARY:";
          const summaryStartIndex = fullText.indexOf(summaryStartIndicator);
          if (summaryStartIndex === -1) {
            console.error("IKIGAI_FINAL_SUMMARY indicator not found.", fullText);
            return;
          }

          const jsonStartSearchIndex = summaryStartIndex + summaryStartIndicator.length;
          const jsonStartIndex = fullText.indexOf("{", jsonStartSearchIndex);
          if (jsonStartIndex === -1) {
            console.error("JSON object start '{' not found after IKIGAI_FINAL_SUMMARY.", fullText);
            return;
          }

          let openBrackets = 0;
          let jsonEndIndex = -1;
          for (let i = jsonStartIndex; i < fullText.length; i++) {
            if (fullText[i] === '{') {
              openBrackets++;
            } else if (fullText[i] === '}') {
              openBrackets--;
            }
            if (openBrackets === 0 && i > jsonStartIndex) {
              jsonEndIndex = i;
              break;
            }
          }

          if (jsonEndIndex === -1) {
            console.error("Mismatched brackets or JSON object end '}' not found.", fullText);
            return;
          }

          const ikigaiDataString = fullText.substring(jsonStartIndex, jsonEndIndex + 1);
          if (isIkigaiChat && ikigaiDataString) {
            try {
              const ikigaiData = JSON.parse(ikigaiDataString);
              
              // Extract the current conversation, filtering for user and assistant messages
              const chatHistory = messages
                .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                .map(msg => {
                  return {
                    id: msg.id,
                    role: msg.role,
                    parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' } as TextUIPart]
                  };
                });

                setChatHistory(chatHistory);

              // Add chat history to ikigai data
              const completeIkigaiData = {
                chat_number: currentChatNumber, // Add currentChatNumber
                ...ikigaiData,
                status: 'complete'
              };
              
              if (saveIkigaiAnswers && userId) {
                await saveIkigaiAnswers(userId, currentChatNumber!, completeIkigaiData, chatHistory);
              }
              
              // Also save to the user_ikigai_data table directly
              fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: userId, 
                  chat_history: chatHistory,
                  chat_number: currentChatNumber, // Pass currentChatNumber for final save
                  ...completeIkigaiData
                }),
              }).catch(error => {
                console.error('Error saving complete Ikigai data:', error);
              });
              window.location.reload();
            } catch (error) {
              console.error("Failed to parse Ikigai JSON:", error);
            }
          }
          // Fetch and update balance after saving Ikigai data
          if (userId) {
            const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance?userId=${userId}`);
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              setBalance(balanceData.ikigai_balance);
            }
          }
        } else{
          const chatHistory = messages
                        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                        .map(msg => {
                  return {
                    id: msg.id,
                    role: msg.role,
                    parts: Array.isArray(msg.parts) ? msg.parts : [{ type: 'text', text: '' } as TextUIPart]
                  };
                });

                setChatHistory(chatHistory);

              // Add chat history to ikigai data
              const completeIkigaiData = {
                status: 'ongoing',
                what_you_love: '',
                what_you_are_good_at: '',
                what_world_needs: '',
                what_you_can_be_paid_for: '',
                what_you_want_to_do: '',
                your_ikigai: '',
                explanation: '',
                next_steps: '',
              };
              
              if (saveIkigaiAnswers && userId) {
                await saveIkigaiAnswers(userId, currentChatNumber!, completeIkigaiData, chatHistory);
              }
              // Fetch and update balance after saving ongoing Ikigai data
              if (userId) {
                const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance?userId=${userId}`);
                if (balanceResponse.ok) {
                  const balanceData = await balanceResponse.json();
                  setBalance(balanceData.ikigai_balance);
                }
              }
        }
          }
          catch (e) {
          console.error("Failed to parse Ikigai data or save it:", e);
        } 
      } else if (userId && moduleContext?.name) {
        try {
          const chatHistory = messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => ({
              id: msg.id,
              role: msg.role,
              parts: msg.parts && msg.parts.length > 0 ? msg.parts : [{ type: 'text', text: (msg.parts?.[0] as TextUIPart)?.text || '' } as TextUIPart],
            }));

          setChatHistory(chatHistory);

          await fetch(`/api/project-ideation`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              moduleName: moduleContext.name,
              chatHistory: chatHistory,
              userName: userName,
            })
          });
          // Fetch and update balance after saving project ideation chat history
          const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ideation-balance?userId=${userId}&balanceType=${moduleContext.balanceType}`);
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setBalance(balanceData.ideation_balance);
          }
        } catch (error) {
          console.error('Error saving project ideation chat history:', error);
        }
      }
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  useEffect(() => {
    if (isIkigaiChat && currentUserId && messages.length > 0) {
      const chatHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => {
          let text = '';
          if (msg.parts) {
            for (const part of msg.parts) {
              if (part.type === 'text') {
                text += part.text;
              }
            }
          }
          return {
            id: msg.id || generateUUID(), // Use existing ID or generate new one
            role: msg.role,
            parts: [{ type: "text", text: text || "" } as TextUIPart],
          };
        });
    }
  }, [messages, currentUserId]);

  //   useEffect(() => {
  //   if (status === 'idle' && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
  //     const lastAssistantMessage = messages[messages.length - 1];
  //     let fullText = "";
  //     if (lastAssistantMessage.parts) {
  //       for (const part of lastAssistantMessage.parts) {
  //         if (part.type === "text") {
  //           fullText += part.text;
  //         }
  //       }
  //     }
  //     if (onChatFinish) {
  //       onChatFinish(fullText, messages);
  //     }
  //   }
  // }, [status, messages, onChatFinish]);

  // const messagesEndRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  return (
    <DataStreamProvider>
      <div className="overscroll-behavior-contain flex h-[95dvh] min-w-0 touch-pan-y flex-col bg-background py-2">
        {/* <ChatHeader
          chatId={id}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          remainingCredits={remainingCredits}
        /> */}
        {/* <div className="overflow-y-auto" ref={messagesEndRef}> */}
          <Messages
            chatId={id}
            isArtifactVisible={isArtifactVisible}
            isReadonly={isReadonly}
            messages={messages}
            regenerate={regenerate}
            selectedModelId={currentModelId}
            setMessages={setMessages}
            status={status}
            isIkigaiChat={isIkigaiChat}
            votes={[]}
          />
        {/* </div> */}

        <div className={`sticky z-1 mx-auto flex w-full gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4 ${isIkigaiChat ? 'bottom-0 mb-0 md:mb-[15px]' : 'bottom-[-20px]'}`}>
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={initialVisibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
              isIkigaiChat={isIkigaiChat}
              currentInteractionTokens={currentInteractionTokens}
              cumulativeTokens={cumulativeTokens}
              remainingCredits={remainingCredits}
              disabled={disabled}
              hideModelAndAttachments={hideModelAndAttachments} // Pass the new prop
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={initialVisibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={[]}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DataStreamProvider>
  );
}
