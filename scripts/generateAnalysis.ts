import { config } from "dotenv";
import { resolve } from "node:path";
import { HumanMessage } from "@langchain/core/messages";

// Load environment variables
config({ path: resolve(__dirname, "../.dev.vars") });

const main = async () => {
    const { initGraph } = await import("../src/agents");

    // Generate a unique thread ID
    const userId = "analysis-manual";
    const { agent, config } = await initGraph(userId);

    const result = await agent.invoke(
        {
            messages: [
                new HumanMessage(
                    "Generate an analysis of the following wallet address: ESRjTPkB7YFhYQv9hn6nqTVHPcDLYUVhvCGE1WuRZWm5",
                ),
            ],
        },
        config,
    );

    console.log(result);
};

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
