import { config } from "dotenv";
import { resolve } from "node:path";
import { HumanMessage } from "@langchain/core/messages";

// Load environment variables
config({ path: resolve(__dirname, "../.dev.vars") });

const main = async () => {
    const { analyzerAgent } = await import("../src/agents/analyzer");

    // Generate a unique thread ID
    const threadId = "analysis-manual";

    const result = await analyzerAgent.invoke(
        {
            messages: [
                new HumanMessage(
                    "Generate an analysis of the following wallet address: ESRjTPkB7YFhYQv9hn6nqTVHPcDLYUVhvCGE1WuRZWm5",
                ),
            ],
        },
        {
            configurable: {
                thread_id: threadId,
            },
        },
    );

    console.log(result);
};

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
