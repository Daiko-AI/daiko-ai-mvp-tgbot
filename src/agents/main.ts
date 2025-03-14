import { END, START, StateGraph } from "@langchain/langgraph";
import { solanaAgentState } from "../utils/state";
import { generalistNode } from "./general";

export async function initGraph(userId: string) {
    try {
        const config = { configurable: { thread_id: userId } };

        const workflow = new StateGraph(solanaAgentState)
            .addNode("agent", generalistNode)
            .addEdge(START, "agent")
            .addEdge("agent", END);

        const graph = workflow.compile();

        return { agent: graph, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
