import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { readDatabase, writeDatabase } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "monitor",
    description: "Will start monitoring any set keyword.",
    category: "keyword",
    ignoreBots: true,
    args: [
        {
            name: "keyword",
            description: "The keyword to monitor.",
            type: "String",
            required: true
        }
    ],
    userGuildPermissions: ["ADMINISTRATOR"],
    commandType: ["application", "message"],
    execute: async (bot, context) => {
        if (!context.interaction) {
            return;
        }

        if (!context.interaction.data) {
            return;
        }

        if (!context.interaction.data.options) {
            return;
        }

        const options = context.interaction.data.options;
        const embed = new AmethystEmbed();
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredKeywords");

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (memberJSON[options[0].value! as string]) {
                embed.setColor("#FF0000");
                embed.setDescription("This keyword is already being monitored!");
                embed.setTitle("Error");
                embed.setTimestamp();

                await bot.helpers.sendInteractionResponse(context.interaction.id!, context.interaction.token!, {
                    type: InteractionResponseTypes.ChannelMessageWithSource,
                    data: {
                        flags: ApplicationCommandFlags.Ephemeral,
                        embeds: [
                            embed
                        ]
                    }
                });

                return;
            }
        }
        
        if (!memberValue) {
            const memberJSON = {
                [options[0].value! as string]: true
            };

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredKeywords", JSON.stringify(memberJSON));
        } else {
            const memberJSON = JSON.parse(memberValue);

            memberJSON[options[0].value! as string] = true;

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredKeywords", JSON.stringify(memberJSON));
        }

        embed.setColor("#C773FF");
        embed.setDescription(`Sucessfully started monitoring \`${options[0].value}\`!`);
        embed.setTitle("Success");
        embed.setTimestamp();

        await bot.helpers.sendInteractionResponse(context.interaction.id!, context.interaction.token!, {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: {
                embeds: [
                    embed
                ]
            }
        });
    }
}