import { webhookCallback } from "grammy";
import { injectEnv } from "./utils/injectEnv";
import { TIMEOUT_MS } from "./constants";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // inject environment variables
        injectEnv(env);

        const { setupTelegramBot } = await import("./lib/telegram/bot");
        const bot = setupTelegramBot(env);

        const start = Date.now();
        const handler = webhookCallback(bot, "cloudflare-mod", {
            timeoutMilliseconds: TIMEOUT_MS,
            onTimeout: () => {
                const end = Date.now();
                console.error(`Timeout: ${end - start}ms`);
                return new Response("Timeout", { status: 408 });
            },
        });

        return handler(request);
    },
} satisfies ExportedHandler<Env, { DAIKO_AI_DEV: KVNamespace }>;
