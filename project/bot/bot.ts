import { startBot } from "../deps.ts";
import { botAmethyst, botClient } from "./deps.ts";

const working = "./project/bot/";

for (const event of Deno.readDirSync(`${working}events/`)) {
    if (event.isDirectory) {
        const eventImport = await import(`./events/${event.name}/event.ts`);

        botAmethyst.on(event.name, eventImport.callback);

        console.log(`Loaded event: ${event.name}`);
    }
}

for (const command of Deno.readDirSync(`${working}commands/`)) {
    if (command.isDirectory) {
        const commandImport = await import(`./commands/${command.name}/command.ts`);

        botAmethyst.amethystUtils.createCommand(commandImport.options);

        console.log(`Loaded command: ${command.name}`);
    }
}

startBot(botClient);

botAmethyst.amethystUtils.updateSlashCommands();