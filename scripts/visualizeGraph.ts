import fs from "node:fs";
import { Writable } from "node:stream";

const main = async () => {
    const { initGraph } = await import("../src/agent");
    const { agent } = await initGraph("analysis-manual");

    const graphBlob = await (await agent.getGraphAsync()).drawMermaidPng({
        withStyles: true,
        curveStyle: "linear",
    });

    const stream = graphBlob.stream();
    const writeStream = fs.createWriteStream("docs/graph.png");
    // @ts-ignore
    await stream.pipeTo(Writable.toWeb(writeStream));
};

main();
