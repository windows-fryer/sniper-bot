import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { readDatabase } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "list",
    description: "Will list all monitored categories.",
    category: "category",
    ignoreBots: true,
    args: [],
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
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredCategories");

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (Object.keys(memberJSON).length != 0) {
                embed.setColor("#C773FF");
                embed.setDescription(`The following categories are being monitored:\n\`\`\`${Object.keys(memberJSON).join(", ")}\`\`\``);
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
        embed.setDescription("There are no monitored categories!");
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