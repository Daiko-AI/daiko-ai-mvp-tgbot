import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4oMini } from "../utils/model";
import { memory, type solanaAgentState } from "../utils/state";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import type { Tool } from "@langchain/core/tools";
import { newsPrompt } from "../prompts/news";
import { Dune7dCryptoNarrativeGrowth } from "../tools/dune/7d_crypto_narrative_growth";

// Initialize tools array
const tools: Tool[] = [new Dune7dCryptoNarrativeGrowth()];

// Only add Tavily search if API key is available
if (process.env.TAVILY_API_KEY) {
    tools.push(new TavilySearchResults());
}

const newsAgent = createReactAgent({
    llm: gpt4oMini,
    tools,
    checkpointSaver: memory,
    prompt: newsPrompt,
});

export const newsNode = async (state: typeof solanaAgentState.State) => {
    console.log("newsNode");

    const result = await newsAgent.invoke({ messages: [] });
    console.log("news result", result);

    return { messages: [...result.messages] };
};
