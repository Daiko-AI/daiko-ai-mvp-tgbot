import { createSolanaTools } from "solana-agent-kit";
import { solanaAgentKit } from "../utils/solana";

export const solanaTools = () => {
    const tools = createSolanaTools(solanaAgentKit);
    return tools;
};
