import type { Bot } from "grammy";

export const setupCommands = (bot: Bot) => {
    bot.command("start", async (ctx) => {
        await ctx.reply("Hello, world!");
    });
};
