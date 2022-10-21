import { AmethystEmbed, CommandOptions, InteractionResponseTypes } from "../../../deps.ts";
import { writeDatabase } from "../../helpers/helpers.ts";

export const options: CommandOptions = {
    name: "channel",
    description: "Will send alerts to the channel set.",
    category: "keyword",
    ignoreBots: true,
    args: [
        {
            name: "channel",
            description: "The channel to alert.",
            type: "Channel",
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

        await writeDatabase(context.interaction.guildId!.toString(), "keywordChannel", context.interaction.data.options[0].value! as string);

        const embed = new AmethystEmbed();

        embed.setColor("#C773FF");
        embed.setDescription(`Sucessfully set the alert channel to \`${context.interaction.data.options[0].value!}\`!`);
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