import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Load environment variables
config({ path: resolve(__dirname, "../.dev.vars") });

const main = async () => {
    const { initGraph } = await import("../src/agents");
    const { agent } = await initGraph("analysis-manual");

    const graphMermaid = (await agent.getGraphAsync()).drawMermaid({
        withStyles: true,
        curveStyle: "linear",
    });

    // create file and write the output in the file
    await writeFile("docs/graph.md", `\`\`\`mermaid\n${graphMermaid}\n\`\`\``);
};

main();
