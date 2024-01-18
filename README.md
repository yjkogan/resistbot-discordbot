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

## Running everything together with Docker Compose
1. `cp .env.example .env`
2. Fill in the `.env` file with:
    1. `DISCORD_TOKEN` (your Discord application's bot's token)
    2. `DISCORD_APP_ID` (you Discord application's ID)
    3. `RP_NETLOCK` (the 'netloc' of RapiPro e.g. rapidpro.com)
    4. `RP_BASEPATH`: The base path for the RapidPro channel, e.g. /c/ds/bac782c2-1234-5678-9012-97887744f573/
    5. `RP_SCHEME`: https | http
3. `docker compose up`

## Testing
### Manual QA

Once things are up and running, you can then hit the flask application on localhost:5555

To test out sending messages to Discord, I've been loading the root page, opening the dev console, and then using JS fetch:

```javascript
// The example body is from the rapid pro test cases
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
