import { END, START, StateGraph } from "@langchain/langgraph";
import { solanaAgentState } from "../utils/state";
import { generalistNode } from "./general";
import { managerNode } from "./manager";
import { analyzerNode } from "./analyzer";
import { managerRouter } from "../utils/route";
import { dataFetchOperatorNode } from "./dataFetchOperator";
import { onchainNode } from "./onchain";
import { newsNode } from "./news";
// import { twitterNode } from "./twitter";

export async function initGraph(userId: string) {
    try {
        const config = { configurable: { thread_id: userId } };

        const workflow = new StateGraph(solanaAgentState)
            .addNode("generalist", generalistNode)
            .addNode("analyzer", analyzerNode)
            .addNode("onchain", onchainNode)
            .addNode("news", newsNode)
            // .addNode("twitter", twitterNode)
            .addNode("manager", managerNode)
            .addNode("dataFetchOperator", dataFetchOperatorNode)
            .addEdge(START, "manager")
            .addConditionalEdges("manager", managerRouter)
            .addEdge("dataFetchOperator", "onchain")
            .addEdge("onchain", "news")
            // .addEdge("onchain", "twitter")
            .addEdge("news", "analyzer")
            // .addEdge("twitter", "analyzer")
            .addEdge("analyzer", END)
            .addEdge("generalist", END);

        const graph = workflow.compile();

        return { agent: graph, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
