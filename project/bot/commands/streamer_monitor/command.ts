import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { readDatabase, writeDatabase, twitchCheckProfile } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "monitor",
    description: "Will start monitoring any set streamer.",
    category: "streamer",
    ignoreBots: true,
    args: [
        {
            name: "streamer",
            description: "The streamer to monitor.",
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
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredStreamers");

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (memberJSON[options[0].value! as string]) {
                embed.setColor("#FF0000");
                embed.setDescription("This streamer is already being monitored!");
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

        try {
            if ((options[0].value as string).length < 3 || (options[0].value as string).length > 25) {
                embed.setColor("#FF0000");
                embed.setDescription("The streamer name must be between 4 and 25 characters long!");
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

            if (options[0].value) {
                const streamer = await twitchCheckProfile(options[0].value as string);

                if (!streamer) {
                    embed.setColor("#FF0000");
                    embed.setDescription("This streamer does not exist!");
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
        } catch (_error) {
            embed.setColor("#FF0000");
            embed.setDescription("This streamer does not exist!");
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
        
        if (!memberValue) {
            const memberJSON = {
                [options[0].value! as string]: true
            };

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredStreamers", JSON.stringify(memberJSON));
        } else {
            const memberJSON = JSON.parse(memberValue);

            memberJSON[options[0].value! as string] = true;

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredStreamers", JSON.stringify(memberJSON));
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