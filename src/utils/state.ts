import { Annotation, MemorySaver } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import { messagesStateReducer } from "@langchain/langgraph";

export const memory = new MemorySaver();

export const solanaAgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),

    // userId: Annotation<string | null>({
    //     reducer: (oldValue, newValue) => newValue ?? oldValue,
    //     default: () => null,
    // }),
});
