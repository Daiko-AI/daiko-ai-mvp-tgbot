import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4oMini } from "../utils/model";
import { memory, type solanaAgentState } from "../utils/state";
import { TwitterSearch } from "../tools/twitterSearch";
import { twitterPrompt } from "../prompts/twitter";

const twitterAgent = createReactAgent({
    llm: gpt4oMini,
    tools: [new TwitterSearch()],
    checkpointSaver: memory,
    prompt: twitterPrompt,
});

export const twitterNode = async (state: typeof solanaAgentState.State) => {
    console.log("twitterNode");
    const { messages } = state;

    const result = await twitterAgent.invoke({ messages });
    console.log("twitter result", result);

    return { messages: [...result.messages] };
};
