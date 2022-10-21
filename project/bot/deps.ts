import { createBot, base64Decode, Intents, enableCachePlugin, enableAmethystPlugin, enableCacheSweepers } from "../deps.ts";
import { textDecode, config } from "./helpers/helpers.ts";

export const botClient = createBot({
    token: textDecode(base64Decode(config["DISCORD_TOKEN"])),
    intents: Intents.GuildMessages | Intents.Guilds,
});
export const botCache = enableCachePlugin(botClient);
export const botAmethyst = enableAmethystPlugin(botCache);

botAmethyst.prefix = config["BOT_PREFIX"];

enableCacheSweepers(botCache);