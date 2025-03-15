import type { solanaAgentState } from "./state";
import { END } from "@langchain/langgraph";

export const managerRouter = (state: typeof solanaAgentState.State) => {
    const { isAnalyzerQuery, isGeneralQuery } = state;

    if (isAnalyzerQuery) {
        return "analyzer";
    }

    if (isGeneralQuery) {
        return "generalist";
    }

    return END;
};
