import { Tool } from "@langchain/core/tools";
import { Client } from "twitter-api-sdk";

export class TwitterSearch extends Tool {
    name = "twitter_search";
    description = `Search for tweets about a specific topic.
    Inputs:
    - word: string, the word to search for, e.g., "Solana" (required)`;

    protected async _call(input: string): Promise<string> {
        try {
            if (!process.env.TWITTER_API_BEARER_TOKEN) {
                throw new Error("TWITTER_API_BEARER_TOKEN is not set");
            }

            const word = input;
            const client = new Client(process.env.TWITTER_API_BEARER_TOKEN);

            const tweets = await client.tweets.tweetsRecentSearch({
                query: word,
                max_results: 20,
                sort_order: "relevancy",
            });

            return JSON.stringify({
                status: "success",
                message: "Tweets retrieved successfully",
                tweets: tweets,
            });

            // biome-ignore lint/suspicious/noExplicitAny: use any
        } catch (error: any) {
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
}
