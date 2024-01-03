## Overview
This repo contains a flask about for forwarding messages we get via the websocket handler to rapid pro, and vice versa

## Getting started
1. Create a discord bot in the [developer portal](https://discord.com/developers/applications)
2. Add it to a server
    1. Visit the OAuth2 side-nav for your discord application
    2. Select "URL Generator"
    3. Check the "bot" scope
    4. Copy the generated URL at the bottom and paste it into a new tab
    5. Add the bot to the relevant server

If you are also in that server, you should be able to DM the bot!

### Running the websocket listener
TODO

### Running the flask application
I've been developing on a machine where I can't mess around too much with local installs so I've just been killing and rebuilding the docker container.

```sh
docker ps --format json | jq '.ID' | xargs docker stop && docker build . --tag resistbot-flask && docker run -d -p 5555:5000 -e DISCORD_BOT_TOKEN=REDACTED -e DISCORD_BOT_ID=REDACTED resistbot-flask | xargs docker logs -f
```

You can then hit the application on localhost:5555.

To test out sending I've been loading the root page, opening the dev console, and then using JS fetch:

```javascript
// The example body is
const rapidProChannel = 'whatevs';
const toChannel = CHANNEL_ID_OF_YOUR_DM_WITH_THE_BOT;
fetch('/rp-response', {
  method: 'POST',
  body: JSON.stringify({"id":"10","text":"Hello World","to": toChannel,"channel":rapidProChannel,"attachments":["https://foo.bar/image.jpg"],"quick_replies":["hello","world"]}),
  headers: {
    'Content-Type': 'application/json'
  }
})
```
