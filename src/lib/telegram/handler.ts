import type { Bot, Context } from "grammy";
import { initGraph } from "../../agent";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { TIMEOUT_MS } from "../../constants";
import type { StreamChunk } from "../../types";
import { logger } from "../../utils/logger";
import { KVStore } from "../kv";
import { SetupStep } from "../../types";
import { proceedToNextStep } from "./command";
import { validateSolanaAddress } from "../../utils/solana";
import { dumpTokenUsage, isAnalyzerMessage, isGeneralistMessage } from "../../utils";

// timeout processing
const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
);

// NOTE: Map for storing chat history which is global memory on cloudflare
const chatHistory = new Map();

export const setupHandler = (bot: Bot, env: Env) => {
    // Get KVStore instance
    if (!env.DAIKO_AI_DEV) {
        logger.error("message handler", "DAIKO_AI_DEV environment variable not found.");
        throw new Error("DAIKO_AI_DEV environment variable not found.");
    }

    const kvStore = new KVStore(env.DAIKO_AI_DEV);

    bot.on("message:text", async (ctx: Context) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !ctx.message?.text || !kvStore) {
            logger.warn("message handler", "User ID or message text is null");
            return;
        }

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
                    case SetupStep.WALLET_ADDRESS: {
                        if (!validateSolanaAddress(text)) {
                            await ctx.reply("Please enter a valid wallet address.", {
                                parse_mode: "Markdown",
                            });
                            return;
                        }

                        await kvStore.updateUserProfile(userId, {
                            walletAddress: text,
                            waitingForInput: null,
                        });

                        await ctx.reply(`Wallet address set to ${text}!`, {
                            parse_mode: "Markdown",
                        });

                        // Proceed to the next step
                        await proceedToNextStep(ctx, env, userId, SetupStep.WALLET_ADDRESS);
                        break;
                    }
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
            logger.debug("message handler", "Initialized Graph");

            if (!chatHistory.has(userId)) {
                chatHistory.set(userId, []);
            }
            const userChatHistory = chatHistory.get(userId);
            userChatHistory.push(new HumanMessage(ctx.message.text));

            // analyzerまたはgeneralistのメッセージを格納する変数
            let latestAgentMessage: string | null = null;

            // send user message to agent
            const stream = await agent.stream(
                {
                    messages: [new HumanMessage(ctx.message.text), ...userChatHistory],
                    userProfile: profile,
                },
                config,
            );
            logger.info("message handler", "Stream created");

            // process response from stream
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<StreamChunk>) {
                    // Get analyzer or generalist message from chunk
                    if (isAnalyzerMessage(chunk)) {
                        const lastIndex = chunk.analyzer.messages.length - 1;
                        if (chunk.analyzer.messages[lastIndex]?.content) {
                            latestAgentMessage = String(chunk.analyzer.messages[lastIndex].content);
                            logger.debug(
                                "message handler",
                                "Got analyzer message",
                                latestAgentMessage,
                            );
                        }
                    } else if (isGeneralistMessage(chunk)) {
                        const lastIndex = chunk.generalist.messages.length - 1;
                        if (chunk.generalist.messages[lastIndex]?.content) {
                            latestAgentMessage = String(
                                chunk.generalist.messages[lastIndex].content,
                            );
                            logger.debug(
                                "message handler",
                                "Got generalist message",
                                latestAgentMessage,
                            );
                        }
                    }

                    dumpTokenUsage(chunk);

                    // latestAgentMessageが取得できた場合の処理
                    if (latestAgentMessage) {
                        if (!ctx.chat?.id) return;
                        await ctx.api.deleteMessage(ctx.chat.id, thinkingMessage.message_id);
                        await ctx.reply(latestAgentMessage, {
                            parse_mode: "Markdown",
                        });
                        userChatHistory.push(new AIMessage(latestAgentMessage));
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
