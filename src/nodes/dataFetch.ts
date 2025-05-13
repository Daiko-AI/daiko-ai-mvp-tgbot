import { getAssetsByOwner } from "../lib/helius";
import { logger } from "../utils/logger";
import type { graphState } from "../utils/state";

// This node is just for connecting other data fetching nodes so that they can be called in parallel
export const dataFetchNode = async (state: typeof graphState.State) => {
    logger.info("dataFetchNode", "dataFetchNode", state);

    if (!state.userProfile) {
        throw new Error("User profile not found");
    }

    const assets = await getAssetsByOwner(state.userProfile.walletAddress);

    return {
        ...state,
        assets,
    };
};
