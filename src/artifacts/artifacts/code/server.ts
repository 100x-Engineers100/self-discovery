import { streamObject } from "ai";
import { z } from "zod";
import { codePrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const codeDocumentHandler = createDocumentHandler<"code">({
  kind: "code",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const resolvedProvider = await myProvider;

    const { fullStream } = streamObject({
      model: resolvedProvider.languageModel("artifact-model"),
      system: codePrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.write({
            type: "data-codeDelta",
            data: code ?? "",
            transient: true,
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description }) => {
    let draftContent = "";

    const resolvedProvider = await myProvider;

    const { fullStream } = streamObject({
      model: resolvedProvider.languageModel("artifact-model"),
      system: codePrompt,
      prompt: document.title,
      schema: z.object({
        title: z.string().describe("The title of the artifact"),
        description: z.string().describe("A short description of the artifact"),
        code: z.string().describe("The code for the artifact"),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { code } = object;

        if (code) {
          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
