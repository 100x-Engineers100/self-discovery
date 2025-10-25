"use server";

import { cookies } from "next/headers";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("gpt-5", model);
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "public" | "private";
}) {
  // TODO: Implement actual database update for chat visibility
}
