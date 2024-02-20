import { response } from "express";
import path from "path";
import urlPackage from "url";

const RP_SCHEME = process.env.RP_SCHEME || "https";
const RP_NETLOC = process.env.RP_NETLOC || "";
const RP_BASEPATH = process.env.RP_BASEPATH || "";
const DISCORD_APP_ID = process.env.DISCORD_APP_ID || "";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

console.log(
  `Config is\n RP_SCHEME: ${RP_SCHEME}\n RP_NETLOC: ${RP_NETLOC}\n RP_BASEPATH: ${RP_BASEPATH}\n DISCORD_APP_ID: ${DISCORD_APP_ID}\n DISCORD_BOT_TOKEN: ${DISCORD_BOT_TOKEN}`
);

type RapidProParams = {
  from: string;
  text: string;
  attachments?: string[];
};

type DiscordMessageJson = { [key: string]: any };

type RapidProJson = {
  id: string;
  to: string;
  attachments?: string[];
  text: string;
  quick_replies?: string[];
};

export async function handleIncomingDM(requestJson: DiscordMessageJson) {
  const channelId = requestJson.channelId; // This is the DM with the User
  const isDM = !requestJson.guildId; // This is None if it's a DM
  const authorId = requestJson.author?.id;

  // Ignore messages from us, or if it's not a DM
  if (authorId === DISCORD_APP_ID || !isDM) {
    console.log("Ignoring message from bot or not a DM");
    return;
  }

  if (!channelId) {
    // or if it's not a DM
    console.error("Got a message missing channel_id");
    return;
  }
  const message = requestJson.content;
  const attachments = requestJson.attachments ?? [];
  const queryParams: RapidProParams = {
    from: channelId,
    text: message,
  };
  if (attachments && attachments.length > 0) {
    queryParams.attachments = attachments.map((a: any) => a.proxyURL);
  }

  // Sending the channel_id as `from` should ensure rapidpro gives us the channel id back in the 'to' field
  const url = getUrl("/receive", queryParams);
  try {
    const rapidProResponse = await fetch(url, { method: "POST" });
    const rapidProResponseJson = await rapidProResponse.json();
    console.log(
      `Response from ${url}: (${rapidProResponse.statusText})`,
      rapidProResponseJson
    );
  } catch (e) {
    console.error(`Error reaching ${url}`, e);
  }
}

export async function handleQuickResponse(requestJson: DiscordMessageJson) {
  // Determine the user from the requestJson
  const channelId = requestJson.channelId;
  const interactionType = requestJson.type;
  if (interactionType !== 3) {
    // MESSAGE_COMPONENT
    console.log(
      `Unexpectedly received non-MESSAGE_COMPONENT interactionType: ${interactionType}`
    );
    return;
  }
  const quickReplySelected = requestJson.customId;
  const url = getUrl("/receive", {
    from: channelId,
    text: quickReplySelected,
  });

  try {
    const rapidProResponse = await fetch(url, { method: "POST" });
    const rapidProResponseJson = await rapidProResponse.json();
    console.log(
      `Response from ${url}: (${rapidProResponse.statusText})`,
      rapidProResponseJson
    );
  } catch (e) {
    console.error(`Error reaching ${url}`, e);
  }
  // TODO: We could store the interaction id here so that when rapidpro
  // sends us back a message we can have it as an interaction response
  // or interaction follow-up
  // This would let us avoid rate limit restrictions
}

export async function handleRapidProResponse(requestJson: RapidProJson) {
  // https://discord.com/developers/docs/resources/channel#create-message

  const messageId = requestJson.id;
  const channelId = requestJson.to;

  if (!messageId || !channelId) {
    console.error("missing messageId or channelId");
  }

  // TODO: Refactor this stuff into a discord module, or use discord.js
  const messageJson = {
    content: requestJson.text,
    embeds: (requestJson.attachments ?? []).map((a) => createEmbed(a)),
    components: [
      {
        type: 1,
        components: (requestJson.quick_replies ?? []).map((qr) =>
          createButtonComponent(qr)
        ),
      },
    ],
  };

  try {
    const url = `https://discord.com/api/channels/${channelId}/messages`;
    // const headers = {
    //   'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
    // }
    // console.log(`Calling ${url} with ${JSON.stringify(headers)} and ${JSON.stringify(messageJson)}`)
    const discordResponse = await fetch(url, {
      method: "POST",
      body: JSON.stringify(messageJson),
      headers: new Headers({
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      }),
    });
    fetch(getUrl("/sent"), {
      method: "POST",
      body: JSON.stringify({ id: messageId }),
    })
      .then(() =>
        console.log(`Successfully hit RapidPro /sent for message`, messageId)
      )
      .catch(() =>
        console.error(`Error reaching RapidPro /sent for message`, messageId)
      );
    const discordResponseJson = await discordResponse.json();
    console.log(
      `Response from ${url}: (${discordResponse.statusText})`,
      discordResponseJson
    );
    if (discordResponse.ok) {
      fetch(getUrl("/delivered"), {
        method: "POST",
        body: JSON.stringify({ id: messageId }),
      })
        .then(() =>
          console.log(
            `Successfully hit RapidPro /delivered for message`,
            messageId
          )
        )
        .catch(() =>
          console.error(
            `Error reaching RapidPro /delivered for message`,
            messageId
          )
        );
    } else {
      fetch(getUrl("/failed"), {
        method: "POST",
        body: JSON.stringify({ id: messageId }),
      })
        .then(() =>
          console.log(
            `Successfully hit RapidPro /failed for message`,
            messageId
          )
        )
        .catch(() =>
          console.error(
            `Error reaching RapidPro /failed for message`,
            messageId
          )
        );
    }
  } catch (e) {
    console.error("Error creating message in Discord", e);
  }
}

function createEmbed(url: string) {
  return { url: url, title: url };
}

function createButtonComponent(buttonText: string) {
  return { type: 2, style: 1, label: buttonText, custom_id: buttonText };
}

function getUrl(pathname: string, queryParams?: { [key: string]: any }) {
  const urlObject = {
    protocol: RP_SCHEME,
    hostname: RP_NETLOC,
    pathname: path.join(RP_BASEPATH, pathname),
    query: queryParams,
  };
  return urlPackage.format(urlObject);
}
