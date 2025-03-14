import { Bot } from "grammy";
import { setupHandler } from "./handler";
import { setupCommands } from "./command";

/**
 * Initialize and configure the Telegram bot
 * @returns webhookCallback handler
 */
export const setupTelegramBot = (env: Env) => {
    // get Telegram bot token
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");
    }

    // create bot
    const bot = new Bot(token);

    // commands
    setupCommands(bot, env);

    // text message handler
    setupHandler(bot, env);

    return bot;
};
