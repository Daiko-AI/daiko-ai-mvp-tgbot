import type { Bot, Context } from "grammy";
import { initGraph } from "../../agents/main";
import { HumanMessage } from "@langchain/core/messages";
import { TIMEOUT_MS } from "../../constants";
import { LogLevel, type StreamChunk } from "../../types";
import { Logger } from "../../utils/logger";
import { KVStore } from "../kv";
import { SetupStep } from "../../types";
import { proceedToNextStep } from "./command";

export const setupHandler = (bot: Bot, env: Env) => {
    // Get KVStore instance
    if (!env.DAIKO_AI_DEV) {
        throw new Error("DAIKO_AI_DEV environment variable not found.");
    }

    const kvStore = new KVStore(env.DAIKO_AI_DEV);

    bot.on("message:text", async (ctx: Context) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !ctx.message?.text || !kvStore) {
            return;
        }

        const logger = new Logger({
            level: LogLevel.INFO,
            enableTimestamp: true,
            enableColors: true,
        });

        try {
            // We've already checked that kvStore is not null above, but the linter still warns
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const profile = await kvStore.getUserProfile(userId);

            // Check if user is in setup process
            if (profile?.waitingForInput) {
                // Handle setup process input
                const waitingFor = profile.waitingForInput;
                const text = ctx.message.text;

                // Process input values for setup
                switch (waitingFor) {
                    case SetupStep.AGE: {
                        const age = Number.parseInt(text);
                        if (Number.isNaN(age) || age <= 0 || age >= 120) {
                            await ctx.reply("Please enter a valid age (numbers only).", {
                                parse_mode: "Markdown",
                            });
                            return;
                        }

                        await kvStore.updateUserProfile(userId, {
                            age,
                            waitingForInput: null,
                        });

                        await ctx.reply(`Age set to ${age} years!`, {
                            parse_mode: "Markdown",
                        });

                        // Proceed to the next step
                        await proceedToNextStep(ctx, env, userId, SetupStep.AGE);
                        break;
                    }

                    case SetupStep.TOTAL_ASSETS: {
                        const totalAssets = Number.parseInt(text.replace(/[,\s]/g, ""));
                        if (Number.isNaN(totalAssets) || totalAssets < 0) {
                            await ctx.reply("Please enter a valid amount (numbers only).", {
                                parse_mode: "Markdown",
                            });
                            return;
                        }

                        await kvStore.updateUserProfile(userId, {
                            totalAssets,
                            waitingForInput: null,
                        });

                        await ctx.reply(
                            `Total assets set to ${totalAssets.toLocaleString()} USD!`,
                            {
                                parse_mode: "Markdown",
                            },
                        );

                        // Proceed to the next step
                        await proceedToNextStep(ctx, env, userId, SetupStep.TOTAL_ASSETS);
                        break;
                    }

                    case SetupStep.CRYPTO_ASSETS: {
                        const cryptoAssets = Number.parseInt(text.replace(/[,\s]/g, ""));
                        if (Number.isNaN(cryptoAssets) || cryptoAssets < 0) {
                            await ctx.reply("Please enter a valid amount (numbers only).", {
                                parse_mode: "Markdown",
                            });
                            return;
                        }

                        await kvStore.updateUserProfile(userId, {
                            cryptoAssets,
                            waitingForInput: null,
                        });

                        await ctx.reply(
                            `Crypto assets set to ${cryptoAssets.toLocaleString()} USD!`,
                            {
                                parse_mode: "Markdown",
                            },
                        );

                        // Proceed to the next step
                        await proceedToNextStep(ctx, env, userId, SetupStep.CRYPTO_ASSETS);
                        break;
                    }
                }
                return;
            }

            // If user has completed setup or is not in setup process, handle as normal conversation
            const thinkingMessage = await ctx.reply("🧠 Thinking...");

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
                            if (!ctx.chat?.id) return;
                            await ctx.api.deleteMessage(ctx.chat.id, thinkingMessage.message_id);
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
