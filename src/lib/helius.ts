import { type DAS, Helius } from "helius-sdk";
import { logger } from "../utils/logger";

// Replace YOUR_API_KEY with the API key from your Helius dashboard
if (!process.env.HELIUS_API_KEY) {
    logger.error("helius", "HELIUS_API_KEY is not set");
    throw new Error("HELIUS_API_KEY is not set");
}

const helius = new Helius(process.env.HELIUS_API_KEY);

export const getAssetsByOwner = async (ownerAddress: string): Promise<DAS.GetAssetResponse[]> => {
    const response = await helius.rpc.getAssetsByOwner({
        ownerAddress,
        page: 1,
        limit: 100,
        displayOptions: {
            showFungible: true,
        },
    });

    return response.items;
};
