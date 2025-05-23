import Client from "twitter-api-sdk";

const main = async () => {
    if (!process.env.TWITTER_API_BEARER_TOKEN) {
        throw new Error("TWITTER_API_BEARER_TOKEN is not set");
    }

    const client = new Client(process.env.TWITTER_API_BEARER_TOKEN);

    const tweets = await client.tweets.tweetsRecentSearch({
        query: "solana",
        max_results: 20,
        sort_order: "relevancy",
    });

    console.log(tweets);
};

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
