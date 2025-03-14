import { Tool } from "@langchain/core/tools";
import type { SolanaAgentKit } from "solana-agent-kit";
import { PublicKey } from "@solana/web3.js";

export class SolanaGetAllAssetsByOwner extends Tool {
    name = "solana_get_all_assets_by_owner";
    description = `Get all assets owned by a specific wallet address.
    Inputs:
    - owner: string, the wallet address of the owner, e.g., "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t" (required)
    - limit: number, the maximum number of assets to retrieve (optional)
    IMPORTANT: You must provide the wallet address as the "owner" parameter, not as "input".
    Example: {"owner": "4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t"}`;

    constructor(private solanaKit: SolanaAgentKit) {
        super();
    }

    protected async _call(input: string): Promise<string> {
        try {
            // const { owner, limit } = JSON.parse(input);
            // TODO: somehow caller node cannot pass the correct json object to this tool, so we're just going to use the input as the owner
            const owner = input;
            const ownerPubkey = new PublicKey(owner);

            const apiKey = this.solanaKit.config.HELIUS_API_KEY;
            if (!apiKey) {
                throw new Error("HELIUS_API_KEY not found in environment variables");
            }

            const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: "get-assets",
                    method: "getAssetsByOwner",
                    params: {
                        ownerAddress: ownerPubkey.toString(),
                        page: 1,
                        limit: 100,
                        displayOptions: {
                            showFungible: true,
                            showCollectionMetadata: true,
                        },
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            }

            // biome-ignore lint/suspicious/noExplicitAny: use any
            const data = (await response.json()) as { result: { items: any[] } };
            const assets = data?.result?.items;

            return JSON.stringify({
                status: "success",
                message: "Assets retrieved successfully",
                assets: assets,
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
