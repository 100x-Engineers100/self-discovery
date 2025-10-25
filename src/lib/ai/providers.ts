import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (async () => {
      const { artifactModel, chatModel, reasoningModel, titleModel } =
        await import("./models.mock");
      return customProvider({
        languageModels: {
          // "gpt-5": chatModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "gpt-5": gateway.languageModel("xai/grok-2-vision-1212"),
        "gpt-5-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("xai/grok-2-1212"),
        "artifact-model": gateway.languageModel("xai/grok-2-1212"),
      },
    });
