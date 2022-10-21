import { AmethystEmbed } from "../../../deps.ts";
import { twitchGetStreamers, readDatabase, listDatabase } from "../../helpers/helpers.ts";
import { botAmethyst } from "../../deps.ts";

let lastOnlineStreamers: string[] = [];

export const callback = () => {
    setInterval(async () => {
        for (const guild of (await listDatabase()).values()) {
            const streamers = await readDatabase(guild, "monitoredStreamers");
            const alertChannel = await readDatabase(guild, "streamerChannel");

            if (!streamers || !alertChannel) {
                return;
            }

            const parsedStreamers = JSON.parse(streamers);
            const streamersArray = Object.keys(parsedStreamers);
            const onlineStreamers = await twitchGetStreamers(streamersArray);

            for (const streamer of onlineStreamers) {
                if (!lastOnlineStreamers.includes(streamer)) {
                    const channel = botAmethyst.channels.get(BigInt(alertChannel));

                    if (!channel) {
                        return;
                    }

                    const embed = new AmethystEmbed();

                    embed.setColor("#C773FF");
                    embed.setDescription(`**${streamer}** is now live!`);
                    embed.setTitle("Streamer Online");
                    embed.url = `https://twitch.tv/${streamer}`;
                    embed.setTimestamp();

                    await botAmethyst.helpers.sendMessage(channel.id, {
                        embeds: [
                            embed
                        ]
                    });
                }
            }

            for (const streamer of lastOnlineStreamers) {
                if (!onlineStreamers.includes(streamer)) {
                    const channel = botAmethyst.channels.get(BigInt(alertChannel));

                    if (!channel) {
                        return;
                    }

                    const embed = new AmethystEmbed();

                    embed.setColor("#C773FF");
                    embed.setDescription(`**${streamer}** is no longer live.`);
                    embed.setTitle("Streamer Offline");
                    embed.url = `https://twitch.tv/${streamer}`;
                    embed.setTimestamp();

                    await botAmethyst.helpers.sendMessage(channel.id, {
                        embeds: [
                            embed
                        ]
                    });
                }
            }

            lastOnlineStreamers = onlineStreamers;
        }
    }, 60000);
}