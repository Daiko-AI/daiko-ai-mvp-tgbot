import { config } from "dotenv";
import { resolve } from "node:path";
import fs from "node:fs";
import { Writable } from "node:stream";

// Load environment variables
config({ path: resolve(__dirname, "../.dev.vars") });

const main = async () => {
    const { initGraph } = await import("../src/agents");
    const { agent } = await initGraph("analysis-manual");

    const graphBlob = await (await agent.getGraphAsync()).drawMermaidPng({
        withStyles: true,
        curveStyle: "linear",
    });

    const stream = graphBlob.stream();
    const writeStream = fs.createWriteStream("docs/graph.png");
    await stream.pipeTo(Writable.toWeb(writeStream));
};

main();
