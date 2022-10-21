import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { writeDatabase, readDatabase } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "forget",
    description: "Will stop monitoring any set streamer.",
    category: "streamer",
    ignoreBots: true,
    args: [
        {
            name: "streamer",
            description: "The streamer to stop monitoring.",
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
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredStreamers");

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (memberJSON[context.interaction.data.options[0].value! as string]) {
                delete memberJSON[context.interaction.data.options[0].value! as string];

                await writeDatabase(context.interaction.guildId!.toString(), "monitoredStreamers", JSON.stringify(memberJSON));

                embed.setColor("#C773FF");
                embed.setDescription("This streamer is no longer being monitored!");
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
        embed.setDescription("This streamer is not being monitored!");
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