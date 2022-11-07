import { AmethystEmbed, ApplicationCommandFlags, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { readDatabase, writeDatabase, twitchGetCategory } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "monitor",
    description: "Will start monitoring any set category.",
    category: "category",
    ignoreBots: true,
    args: [
        {
            name: "category",
            description: "The category to monitor.",
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
        const memberValue = await readDatabase(context.interaction.guildId!.toString(), "monitoredCategories");

        const foundCategory = await twitchGetCategory(options[0].value! as string);

        if (!foundCategory) {
            embed.setColor("#FF0000");
            embed.setDescription("Category not found.");
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

        if (memberValue) {
            const memberJSON = JSON.parse(memberValue);

            if (memberJSON[foundCategory["name"]]) {
                embed.setColor("#FF0000");
                embed.setDescription("This category is already being monitored!");
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
                [foundCategory["name"]]: foundCategory["id"]
            };

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredCategories", JSON.stringify(memberJSON));
        } else {
            const memberJSON = JSON.parse(memberValue);

            memberJSON[foundCategory["name"]] = foundCategory["id"];

            await writeDatabase(context.interaction.guildId!.toString(), "monitoredCategories", JSON.stringify(memberJSON));
        }

        embed.setColor("#C773FF");
        embed.setDescription(`Sucessfully started monitoring \`${foundCategory["name"]}\`!`);
        embed.setThumbnail(foundCategory["box_art_url"]);
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