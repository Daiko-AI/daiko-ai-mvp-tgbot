import { Annotation, MemorySaver } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { messagesStateReducer } from "@langchain/langgraph";
import type { UserProfile } from "../types/db";
import type { DAS } from "helius-sdk";

export const memory = new MemorySaver();

export const graphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    userAssets: Annotation<DAS.GetAssetResponse[]>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => [],
    }),

    userProfile: Annotation<UserProfile | null>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => null,
    }),

    isDataFetchNodeQuery: Annotation<boolean>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => false,
    }),

    isGeneralQuery: Annotation<boolean>({
        reducer: (oldValue, newValue) => newValue ?? oldValue,
        default: () => false,
    }),
});
