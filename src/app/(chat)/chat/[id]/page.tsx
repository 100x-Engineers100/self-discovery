"use client";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { ChatMessage } from "@/lib/types";
import { VisibilityType } from "@/components/visibility-selector";
import React from "react";

// Placeholder for DEFAULT_CHAT_MODEL
const DEFAULT_CHAT_MODEL = "gpt-4";

interface ChatData {
  id: string;
  userId: string;
  visibility: VisibilityType;
  lastContext: undefined;
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);

  // Simulate chat data and messages for now
  const chat: ChatData = {
    id: id,
    userId: "dummy-user",
    visibility: "public",
    lastContext: undefined,
  };

  const uiMessages: ChatMessage[] = [
    {
      id: "1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello! How can I help you today?" }],
      metadata: { createdAt: new Date().toISOString() },
    },
  ]; // Placeholder for UI messages

  const session = { user: { id: "dummy-user" } }; // Simulate a logged-in session

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        balance={0} // Dummy balance
        setBalance={() => {}} // Dummy setBalance function
      />
      <DataStreamHandler />
    </>
  );
}