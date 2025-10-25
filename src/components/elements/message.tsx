import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage, IkigaiData } from "@/lib/types";
import { Markdown } from "./markdown";
import { getTextFromMessage } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@/lib/db/frontend-types";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full gap-2 py-4",
      from === "user"
        ? "is-user items-end justify-end"
        : "is-assistant items-start justify-start",
      "[&>div]:max-w-[80%]",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm",
      "group-[.is-user]:bg-secondary group-[.is-user]:text-primary-foreground",
      "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
      "is-user:dark",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn("size-8 ring-1 ring-border", className)} {...props}>
    <AvatarImage alt="" className="my-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
  </Avatar>
);

export const PreviewMessage = ({
  chatId,
  setMessages,
  regenerate,
  message,
  isLoading,
  isReadonly,
  requiresScrollPadding,
  vote,
  isIkigaiChat,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  chatId: string;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  message: ChatMessage;
  isLoading: boolean;
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  vote: Vote | undefined;
  isIkigaiChat?: boolean;
}) => {
  // const { user } = useUser(); // Removed as it's no longer needed
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // const handleSaveIkigai = async (ikigaiData: IkigaiData) => {
  //   if (!user?.id) return;
  //   setIsSaving(true);
  //   try {
  //     // Removed saveIkigaiAnswers call
  //     setIsSaved(true);
  //     toast.success("Ikigai data saved successfully!");
  //   } catch (error) {
  //     console.error("Failed to save Ikigai data:", error);
  //     toast.error("Failed to save Ikigai data.");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const isUser = message.role === "user";
  const content = getTextFromMessage(message);

  // if (message.ui === "ikigaiSaveButton" && isIkigaiChat) {
  //   const ikigaiData = message.data as IkigaiData;
  //   return (
  //     <div className="flex justify-center py-4">
  //       <Button onClick={() => handleSaveIkigai(ikigaiData)} disabled={isSaving || isSaved}>
  //         {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save Ikigai"}
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <Message
      className={cn(
        // requiresScrollPadding && "pb-[calc(100vh-400px)]",
      )}
      from={message.role}
      {...props}
    >
      {isUser && (
        <MessageContent>
          {content && <Markdown content={content} />}
        </MessageContent>
      )}
      {!isUser && (
        <MessageContent>
          {content && <Markdown content={content} />}
        </MessageContent>
      )}
    </Message>
  );
};

export const ThinkingMessage = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>Thinking...</div>
);
