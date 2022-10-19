import { enableAmethystPlugin, enableCachePlugin, createBot, base64Decode, Intents, startBot } from "../deps.ts";
import { textDecode } from "./helpers/helpers.ts";

const config = JSON.parse(Deno.readTextFileSync("../"));

export const botClient = createBot({
    token: textDecode(base64Decode(config["DISCORD_TOKEN"])),
    intents: Intents.GuildMessages | Intents.Guilds,
});

export const botCache = enableCachePlugin(botClient);
export const botAmethyst = enableAmethystPlugin(botCache);

for (const event of Deno.readDirSync("./events/")) {
    if (event.isDirectory) {
        const eventImport = await import(`./events/${event.name}/event.ts`);

        botAmethyst.on(event.name, eventImport.callback);
    }
}

for (const command of Deno.readDirSync("./commands/")) {
    if (command.isDirectory) {
        const commandImport = await import(`./commands/${command.name}/command.ts`);

        botAmethyst.amethystUtils.createCommand(commandImport.options);
    }
}

startBot(botClient);