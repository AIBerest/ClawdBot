---
name: hq-router
description: "Automatically route HQ / Inbox messages into the right Telegram work chat"
metadata:
  openclaw:
    emoji: "🧭"
    events:
      - "message:preprocessed"
---

# hq-router

Route messages from `00 — HQ / Inbox` into the right Telegram work chat.

## What it does

- accepts only messages from the configured HQ chat
- optionally restricts routing to one Telegram sender id
- classifies the task by explicit marker first, then by keywords
- sends a handoff message into the destination chat through Telegram Bot API
- replies in HQ with a short routing confirmation

## Supported markers

- `РАЗБОР:` -> `10 — Crypto Desk`
- `ПОСТ:` -> `20 — Content Studio`
- `АРХИТЕКТУРА:` -> `30 — Agent Lab`
- `КОД:` -> `40 — Build / Coding`
- `ПЛАН:` -> `50 — Ops / Tasks`

## Required env

- `HQ_ROUTER_SOURCE_CHAT_ID`
- `HQ_ROUTER_CRYPTO_CHAT_ID`
- `HQ_ROUTER_CONTENT_CHAT_ID`
- `HQ_ROUTER_AGENT_CHAT_ID`
- `HQ_ROUTER_BUILD_CHAT_ID`
- `HQ_ROUTER_OPS_CHAT_ID`

## Optional env

- `HQ_ROUTER_ALLOWED_SENDER_ID`
- `HQ_ROUTER_BOT_TOKEN`

If `HQ_ROUTER_BOT_TOKEN` is unset, the hook tries to read `channels.telegram.botToken` from `/home/node/.openclaw/openclaw.json`.
