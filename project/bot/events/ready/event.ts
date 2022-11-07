import { ActivityTypes, AmethystEmbed } from "../../../deps.ts";
import { twitchGetStreamers, readDatabase, listDatabase, twitchGetCategory, twitchGetCategories, twitchCheckProfile } from "../../helpers/helpers.ts";
import { botAmethyst, botClient } from "../../deps.ts";

const lastOnlineStreamers: { [guild: string]: string[] } = {};
const lastFoundStreamers: { [guild: string]: string[] } = {};

const streamerCheck = async () => {
    for (const guild of (await listDatabase()).values()) {
        if (!lastOnlineStreamers[guild]) {
            lastOnlineStreamers[guild] = [];
        }

        const streamers = await readDatabase(guild, "monitoredStreamers");
        const alertChannel = await readDatabase(guild, "streamerChannel");
        
        if (!streamers || !alertChannel) {
            return;
        }

        const parsedStreamers = JSON.parse(streamers);
        const streamersArray = Object.keys(parsedStreamers);
        const onlineStreamers = await twitchGetStreamers(streamersArray);

        for (const streamer of onlineStreamers) {
            if (!lastOnlineStreamers[guild].includes(streamer["user_name"])) {
                const channel = botAmethyst.channels.get(BigInt(alertChannel));

                if (!channel) {
                    return;
                }

                const embed = new AmethystEmbed();

                embed.setColor("#C773FF");
                embed.setDescription(`**${streamer["user_name"]}** streaming: **${streamer["title"].length < 1 ? "No Title" : streamer["title"]}**`);
                embed.setThumbnail(streamer["thumbnail_url"]);
                embed.setTitle(`Streamer Online on ${streamer["game_name"].length < 1 ? "No Game" : streamer["game_name"]}`);
                embed.url = `https://twitch.tv/${streamer["user_name"]}`;
                embed.setTimestamp(Date.parse(streamer["started_at"]));
                embed.setFooter(`Viewers: ${streamer["viewer_count"]}`);

                await botAmethyst.helpers.sendMessage(channel.id, {
                    embeds: [
                        embed
                    ]
                });
            }
        }

        const onlineStreamerNames = onlineStreamers.map((streamer) => streamer["user_name"]);

        for (const streamer of lastOnlineStreamers[guild]) {
            if (!onlineStreamerNames.includes(streamer)) {
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

        lastOnlineStreamers[guild] = onlineStreamerNames;
    }
}

const categoryCheck = async () => {
    for (const guild of (await listDatabase()).values()) {
        const category = await readDatabase(guild, "monitoredCategories");
        const alertChannel = await readDatabase(guild, "categoryChannel");
        const keywords = await readDatabase(guild, "monitoredKeywords");

        if (!category || !alertChannel || !keywords) {
            return;
        }

        const parsedCategory = JSON.parse(category);
        const categoryArray = Object.values(parsedCategory) as string[];
        const foundCategories = await twitchGetCategories(categoryArray);
        const foundCategoryNames = foundCategories.map((category) => category["user_name"]);
        const parsedKeywords = JSON.parse(keywords);

        const foundKeywords = [];

        for (const foundCategory of foundCategories) {
            let found_keyword = false;

            for (const keyword of Object.keys(parsedKeywords)) {
                if (foundCategory["title"].toLowerCase().includes(keyword.toLowerCase())) {
                    found_keyword = true;
                    
                    break;
                }
            }

            if (!found_keyword) {
                continue;
            }

            foundKeywords.push(foundCategory["user_name"]);

            if (!lastFoundStreamers[guild]) {
                continue
            }
            
            if (!lastFoundStreamers[guild].includes(foundCategory["user_name"])) {
                const channel = botAmethyst.channels.get(BigInt(alertChannel));

                if (!channel) {
                    return;
                }

                const embed = new AmethystEmbed();

                embed.setColor("#C773FF");
                embed.setDescription(`**${foundCategory["user_name"]}** streaming: **${foundCategory["title"].length < 1 ? "No Title" : foundCategory["title"]}**`);
                embed.setThumbnail(foundCategory["thumbnail_url"]);
                embed.setTitle(`Streamer Online on ${foundCategory["game_name"].length < 1 ? "No Game" : foundCategory["game_name"]}`);
                embed.url = `https://twitch.tv/${foundCategory["user_name"]}`;
                embed.setTimestamp(Date.parse(foundCategory["started_at"]));
                embed.setFooter(`Viewers: ${foundCategory["viewer_count"]}`);
                
                await botAmethyst.helpers.sendMessage(channel.id, {
                    embeds: [
                        embed
                    ]
                });
            }
        }

        if (!lastFoundStreamers[guild]) {
            lastFoundStreamers[guild] = foundKeywords;
        }
        
        for (const category of lastFoundStreamers[guild]) {
            if (!foundCategoryNames.includes(category)) {
                const channel = botAmethyst.channels.get(BigInt(alertChannel));

                if (!channel) {
                    return;
                }

                const embed = new AmethystEmbed();
                embed.setColor("#C773FF");
                embed.setDescription(`**${category}** is no longer live.`);
                embed.setTitle("Streamer Offline");
                embed.url = `https://twitch.tv/${category}`;
                embed.setTimestamp();

                await botAmethyst.helpers.sendMessage(channel.id, {
                    embeds: [
                        embed
                    ]
                });
            }
        }

        lastFoundStreamers[guild] = foundKeywords;
    }
}

let countDown = 60000;

export const callback = () => {
    setInterval(async () => {
        await streamerCheck();
        await categoryCheck();
    }, 60000);

    setInterval(async () => {
        countDown -= 6000;

        if (countDown <= 0) {
            countDown = 60000;
        }
        
        await botClient.helpers.editBotStatus({
            status: "online",
            activities: [{
                name: `next check in ${countDown / 1000} seconds`,
                type: ActivityTypes.Watching,
                createdAt: Date.now()
            }]
        })
    }, 6000);

    // console.log(await twitchGetCategory("roblox"))

    // console.log(await twitchGetCategories(["509658"]));

    console.log("Bot running!");
}