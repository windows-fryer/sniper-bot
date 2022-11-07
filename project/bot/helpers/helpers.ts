import { MongoClient, ObjectId, base64Decode } from "../../deps.ts";

const working = "./project/bot/";
export const config = JSON.parse(Deno.readTextFileSync(`${working}configuration/config.json`));

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const textDecode = (data: Uint8Array) => textDecoder.decode(data);
export const textEncode = (data: string) => textEncoder.encode(data);

const mongoClient = new MongoClient();

await mongoClient.connect(config["MONGO_URI"]);

interface guildSchema {
    _id: ObjectId,
    memberName: string,
    memberData: string // Ah yes, safety
}

export const writeDatabase = async (guildId: string, member: string, memberData: string) => {    
    const database = mongoClient.database("Sniper-Bot");
    const guilds = database.collection<guildSchema>(guildId);

    const guild = await guilds.findOne({ memberName: member });

    if (!guild) {
        await guilds.insertOne({
            memberName: member,
            memberData: memberData
        });

        return;
    }

    await guilds.updateOne({ memberName: member }, {
        $set: {
            memberData: memberData
        }
    });
}

export const readDatabase = async (guildId: string, member: string) => {
    const database = mongoClient.database("Sniper-Bot");
    const guilds = database.collection<guildSchema>(guildId);

    const memberData = await guilds.findOne({ memberName: member });

    if (!memberData) {
        return null;
    }

    return memberData.memberData;
}

export const listDatabase = async () => {
    const database = mongoClient.database("Sniper-Bot");

    return await database.listCollectionNames();
}

let twitchBarer = "";
let twitchTimeout = 0;

const clientId = textDecode(base64Decode(config["TWITCH_ID"]));
const clientSecret = textDecode(base64Decode(config["TWITCH_SECRET"]));

export const twitchAuthenticate = async () => {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
        method: "POST"
    });

    const json = await response.json();

    twitchBarer = json["access_token"] as string;
    twitchTimeout = Date.now() + (json["expires_in"] * 1000);

    return;
}

export const twitchTimeoutCheck = async () => {
    if (Date.now() > twitchTimeout) {
        await twitchAuthenticate();
    }
}

export const twitchGetStreamers = async (streamers: string[]) => {
    await twitchTimeoutCheck();

    const streamersOnline: any[] = [];
    let cursorPosition = "";

    let response = await fetch(`https://api.twitch.tv/helix/streams?first=10&user_login=${streamers.join("&user_login=")}`, {
        headers: {
            "Authorization": `Bearer ${twitchBarer}`,
            "Client-Id":  clientId
        }
    });

    let json = await response.json();

    if (json["data"] && json["data"].length > 0) {
        if (json["pagination"]) {
            cursorPosition = json["pagination"]["cursor"];
        }

        json["data"].forEach((stream: any) => {
            if (streamers.includes(stream["user_name"]) && stream["type"] == "live" && !streamersOnline.includes(stream)) {
                streamersOnline.push(stream);
            }
        });
    }

    while (cursorPosition != "") {
        response = await fetch(`https://api.twitch.tv/helix/streams?first=10&user_login=${streamers.join("&user_login=")}&after=${cursorPosition}`, {
            headers: {
                "Authorization": `Bearer ${twitchBarer}`,
                "Client-Id":  clientId
            }
        });

        json = await response.json();

        if (json["data"] && json["data"].length > 0) {
            if (json["pagination"]) {
                cursorPosition = json["pagination"]["cursor"];
            }

            json["data"].forEach((stream: any) => {
                if (streamers.includes(stream["user_name"]) && stream["type"] == "live" && !streamersOnline.includes(stream)) {
                    streamersOnline.push(stream);
                }
            });
        } else {
            cursorPosition = "";
        }
    }

    for (const streamer of streamersOnline) {
        streamer["thumbnail_url"] = streamer["thumbnail_url"].replace("{width}", "1920").replace("{height}", "1080");
    }

    return streamersOnline;
}

export const twitchCheckProfile = async (streamer: string) => {
    await twitchTimeoutCheck();

    const response = await fetch(`https://api.twitch.tv/helix/users?login=${streamer}`, {
        headers: {
            "Authorization": `Bearer ${twitchBarer}`,
            "Client-Id":  clientId
        }
    });

    const json = await response.json();

    if (json["data"] && json["data"].length > 0) {
        return json;
    }

    return null;
}
    

export const twitchGetProfile = async (streamer: string, live_only?: boolean) => {
    await twitchTimeoutCheck();

    const response = await fetch(`https://api.twitch.tv/helix/channels?query=${streamer}${live_only ? "&live_only=true" : ""}`, {
        headers: {
            "Authorization": `Bearer ${twitchBarer}`,
            "Client-Id":  clientId
        }
    });

    const json = await response.json();

    if (json["data"] && json["data"].length > 0) {
        return json["data"][0];
    }
}

export const twitchGetCategory = async (category_name: string) => {
    await twitchTimeoutCheck();

    const response = await fetch(`https://api.twitch.tv/helix/search/categories?query=${category_name}&first=10`, {
        headers: {
            "Authorization": `Bearer ${twitchBarer}`,
            "Client-Id":  clientId
        }
    });

    const json = await response.json();

    if (json["data"] && json["data"].length > 0) {
        for (const category of json["data"]) {

            if (category["name"].toLowerCase() == category_name.toLowerCase()) {
                category["box_art_url"] = category["box_art_url"].replace("52x", "520x").replace("x72", "x720");

                return category;
            }
        }
    }

    return null;
}

export const twitchGetCategories = async (gameIds: string[]) => {
    await twitchTimeoutCheck();

    let response = await fetch(`https://api.twitch.tv/helix/streams?first=10&game_id=${gameIds.join("&game_id=")}`, {
        headers: {
            "Authorization": `Bearer ${twitchBarer}`,
            "Client-Id":  clientId
        }
    });

    let cursorPosition = "";
    const streamers: any[] = [];
    const streamerNames: string[] = [];

    let json = await response.json();

    if (json["data"] && json["data"].length > 0) {
        if (json["pagination"]) {
            cursorPosition = json["pagination"]["cursor"];
        }

        json["data"].forEach((stream: any) => {
            if (stream["type"] == "live" && !streamerNames.includes(stream["user_name"])) {
                streamers.push(stream);
                streamerNames.push(stream["user_name"]);
            }
        });
    }

    while (cursorPosition != "") {
        response = await fetch(`https://api.twitch.tv/helix/streams?first=10&game_id=${gameIds.join("&game_id=")}&after=${cursorPosition}`, {
            headers: {
                "Authorization": `Bearer ${twitchBarer}`,
                "Client-Id":  clientId
            }
        });

        json = await response.json();

        if (json["data"] && json["data"].length > 0) {
            if (json["pagination"]) {
                cursorPosition = json["pagination"]["cursor"];
            }

            json["data"].forEach((stream: any) => {
                if (stream["type"] == "live" && !streamerNames.includes(stream["user_name"])) {
                    streamers.push(stream);
                    streamerNames.push(stream["user_name"]);
                }
            });
        } else {
            cursorPosition = "";
        }
    }

    for (const streamer of streamers) {
        streamer["thumbnail_url"] = streamer["thumbnail_url"].replace("{width}", "1920").replace("{height}", "1080");
    }

    return streamers;
}