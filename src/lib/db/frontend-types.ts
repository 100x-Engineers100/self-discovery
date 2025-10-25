export interface User {
  id: string;
  email: string;
  password?: string;
}

export interface Chat {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: "public" | "private";
  lastContext?: AppUsage | null;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Document {
  id: string;
  createdAt: Date;
  title: string;
  content?: string;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
}

export interface AppUsage {
  // Define properties of AppUsage based on its usage in ai-chatbot/lib/usage.ts
  // For now, I'll leave it as a placeholder or infer from its usage.
  // If you have a specific definition for AppUsage, please provide it.
  tokenCount: number;
  cost: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  // Add other properties as needed
}

import type { UIMessagePart } from "ai";
import type { CustomUIDataTypes, ChatTools } from "../types";

export interface DBMessage {
  id: string;
  chatId: string;
  role: string;
  content: unknown;
  parts: UIMessagePart<CustomUIDataTypes, ChatTools>[];
  createdAt: Date;
}
