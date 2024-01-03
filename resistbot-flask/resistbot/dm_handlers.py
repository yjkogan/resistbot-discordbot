from collections import namedtuple
from flask import current_app
import os
import requests
from urllib.parse import urlunparse, urlencode, urljoin

UrlComponents = namedtuple(
    "UrlComponents", ["scheme", "netloc", "url", "path", "query", "fragment"]
)

RP_SCHEME = os.environ.get("RP_SCHEME", "https")
RP_NETLOCK = os.environ.get("RP_NETLOC", "rapidprod.com")
RP_BASE_PATH = os.environ.get("RP_BASE_PATH", "")
DISCORD_BOT_ID = os.environ.get("DISCORD_BOT_ID", "")
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
# TODO: Throw runtime error if any of these are missing

print(f"Config is\n RP_SCHEME: {RP_SCHEME}\n RP_NETLOCK: {RP_NETLOCK}\n RP_BASE_PATH: {RP_BASE_PATH}\n DISCORD_BOT_ID: {DISCORD_BOT_ID}\n DISCORD_BOT_TOKEN: {DISCORD_BOT_TOKEN}")

def handle_incoming_dm(request_json):
    channel_id = request_json.get("channelId")  # This is the DM with the User
    is_dm = request_json.get("guildId") is None  # This is None if it's a DM
    author_id = request_json.get("author", {}).get("id")

    # Ignore messages from us, or if it's not a DM
    if author_id == DISCORD_BOT_ID or not is_dm:
        current_app.logger.info("Ignoring message from bot or not a DM")
        return
    # Do something to assert this is a DM
    if not channel_id:  # or if it's not a DM
        current_app.logger.warn("Got a message missing channel_id")
        # TODO: Log an error
        return
    message = request_json.get("content", "")
    attachments = request_json.get("attachments", [])
    query_params = {
        "from": channel_id,
        "text": message,
    }
    if attachments and len(attachments) > 0:
        query_params["attachments"] = [a['proxyURL'] for a in attachments]
    # Sending the channel_id as `from` should ensure rapidpro gives us the channel id back in the 'to' field
    url = _get_url("/receive", query_params)
    current_app.logger.info(f"sending to rp from handle_incoming_dm: {url}")
    # requests.post(url)


def handle_quick_response(request_json):
    # Determine the user from the request_json
    # TODO: Immediately pong the interaction
    # but it doesn't look like discord.js exposes the interaction token???
    channel_id = request_json.get("channelId", None)
    interaction_type = request_json.get("type", None)
    if interaction_type != 3:  # MESSAGE_COMPONENT
        # log error
        return
    quick_reply_selected = request_json.get("customId", "")
    url = _get_url('/receive', {
        "from": channel_id,
        "text": quick_reply_selected
    })
    current_app.logger.info(f"sending to rp from handle_quick_response: {url}")
    # requests.post(url)
    # TODO: We could store the interaction id here so that when rapidpro
    # sends us back a message we can have it as an interaction response
    # or interaction follow-up
    # This would let us avoid rate limit restrictions


def handle_rp_response(request_json):
    # https://discord.com/developers/docs/resources/channel#create-message

    message_id = request_json.get("id", None)
    channel_id = request_json.get("to", None)

    if not message_id or not channel_id:
        return "Error: missing message_id or channel_id", 400

    # TODO: Refactor this stuff into a discord module
    message_json = {
        "content": request_json.get("text", ""),
        "embeds": [_create_embed(url) for url in request_json.get("attachments", [])],
        "components": [
            {
                "type": 1,
                "components": [
                    _create_button_component(qr)
                    for qr in request_json.get("quick_replies", [])
                ],
            }
        ],
    }

    result = requests.post(
        f"https://discord.com/api/channels/{channel_id}/messages",
        json=message_json,
        headers={
            'Authorization': f'Bot {DISCORD_BOT_TOKEN}'
        }
    )
    current_app.logger.info(f"discord sending result: {result}")
    # requests.post(_get_url('/sent'), json={"id": message_id})
    current_app.logger.info(f"sending to rp from handle_rp_response: {_get_url('/sent')}")
    if result.status_code != 200:
        # requests.post(_get_url('/failed'), json={"id": message_id})
        current_app.logger.info(f"sending to rp from handle_rp_response: {_get_url('/failed')}")
    else:
        # requests.post(_get_url('/delivered'), json={"id": message_id})
        current_app.logger.info(f"sending to rp from handle_rp_response: {_get_url('/delivered')}")


def _create_embed(url):
    return {"url": url, "title": url}


def _create_button_component(button_text):
    return {"type": 2, "style": 1, "label": button_text, "custom_id": button_text}


def _get_url(path, query_params=None):
    _query_params = query_params or {}
    return urlunparse(
        UrlComponents(
            scheme=RP_SCHEME,
            netloc=RP_NETLOCK,
            query=urlencode(_query_params),
            url=urljoin(RP_BASE_PATH, path),
            fragment="",
            path="",
        )
    )
