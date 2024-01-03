import 'dotenv/config'

import {Client, GatewayIntentBits, Partials, Events} from 'discord.js'
import process from 'node:process'

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.User, Partials.Reaction, Partials.Message, Partials.Channel, Partials.GuildMember, Partials.GuildScheduledEvent],
    ws: {
        version: 10,
    },
})

client.on(Events.MessageCreate, async (message) => {
    console.log('Got message', message);
    console.log('Got message JSON', message.toJSON());
    fetch('http://localhost:5555/incoming-dm', {
        method: 'POST',
        body: JSON.stringify({
            ...message,
            attachments: message.attachments.map((a) => a.toJSON()),
        }),
        headers: {
            "Content-Type": "application/json",
          },
    }).then((res) => {
        console.log('Got response', res)
    }).catch((e) => {
        console.error('Got error', e)
    });
})

client.on(Events.InteractionCreate, async (interaction) => {
    console.log('Got interaction', interaction)
    if (!interaction.isButton()) return;

    // TODO: Disable the buttons in the original message probably
    fetch('http://localhost:5555/incoming-interaction', {
        method: 'POST',
        body: JSON.stringify(interaction),
        headers: {
            "Content-Type": "application/json",
          },
    }).then((res) => {
        console.log('Got response to interaction', res)
    }).catch((e) => {
        console.error('Got error for interaction', e)
    });
    interaction.reply({ content: 'Pong', ephemeral: true })
})

client.on('ready', async () => {
    console.log('Ready')
})

client
    .login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Logged in')
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
