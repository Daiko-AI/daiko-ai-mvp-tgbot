import type { Bot, Context } from "grammy";
import { initGraph } from "../../agents/main";
import { HumanMessage } from "@langchain/core/messages";
import { TIMEOUT_MS } from "../../constants";
import { LogLevel, type StreamChunk } from "../../types";
import { Logger } from "../../utils/logger";

export const setupHandler = (bot: Bot) => {
    bot.on("message:text", async (ctx: Context) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !ctx.message?.text) {
            return;
        }

        const logger = new Logger({
            level: LogLevel.INFO,
            enableTimestamp: true,
            enableColors: true,
        });

        try {
            // initialize graph
            const { agent, config } = await initGraph(userId);
            logger.info("message handler", "Initialized Graph");

            // send user message to agent
            const stream = await agent.stream(
                {
                    messages: [new HumanMessage(ctx.message.text)],
                },
                config,
            );
            logger.info("message handler", "Stream created");

            // timeout processing
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
            );

            // process response from stream
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<StreamChunk>) {
                    // logger.info("message handler", "Received chunk", chunk);

                    // Dump token usage
                    if (chunk.agent?.messages[chunk.agent.messages.length - 1]?.usage_metadata) {
                        logger.info(
                            "message handler",
                            "Usage metadata",
                            chunk.agent.messages[chunk.agent.messages.length - 1].usage_metadata,
                        );
                    }

                    if ("agent" in chunk) {
                        const lastIndex = chunk.agent.messages.length - 1;
                        if (chunk.agent.messages[lastIndex].content) {
                            await ctx.reply(String(chunk.agent.messages[lastIndex].content), {
                                parse_mode: "Markdown",
                            });
                        }
                    }
                }
            } catch (error: unknown) {
                if (error instanceof Error && error.message === "Timeout") {
                    await ctx.reply(
                        "I'm sorry, the operation took too long and timed out. Please try again.",
                    );
                } else {
                    logger.error("message handler", "Error processing stream:", error);
                    await ctx.reply("I'm sorry, an error occurred while processing your request.");
                }
            }
        } catch (error) {
            logger.error("message handler", "Error initializing agent:", error);
            await ctx.reply("I'm sorry, an error occurred while initializing the agent.");
        }
    });
};
