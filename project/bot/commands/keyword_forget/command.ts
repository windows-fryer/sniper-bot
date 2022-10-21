import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { writeDatabase, readDatabase } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "forget",
    description: "Will stop monitoring any set keyword.",
    category: "keyword",
    ignoreBots: true,
    args: [
        {
            name: "keyword",
            description: "The keyword to stop monitoring.",
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

        const embed = new AmethystEmbed();
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredKeywords");

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (memberJSON[context.interaction.data.options[0].value! as string]) {
                delete memberJSON[context.interaction.data.options[0].value! as string];

                await writeDatabase(context.interaction.guildId!.toString(), "monitoredKeywords", JSON.stringify(memberJSON));

                embed.setColor("#C773FF");
                embed.setDescription("This keyword is no longer being monitored!");
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

                return;
            }
        }

        embed.setColor("#FF0000");
        embed.setDescription("This keyword is not being monitored!");
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
    }
}