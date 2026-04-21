---
name: push-skills
description: "Push skills repo to GitHub on Telegram command"
metadata:
  openclaw:
    emoji: "⬆️"
    events:
      - "message:preprocessed"
    requires:
      bins:
        - "bash"
        - "git"
---

# push-skills

Run `skills-git-push.sh` from a Telegram chat command.

## Usage (Telegram)

- `/push_skills` — commit message defaults to `Update skills`
- `/push_skills my message` — use `my message` as commit message

## Security

This hook **requires** `PUSH_SKILLS_ALLOWED_SENDER_ID` to be set (exact match). If unset, it will refuse to run.

## Config (env on gateway host)

- `PUSH_SKILLS_ALLOWED_SENDER_ID`: required, the Telegram sender id allowed to trigger pushes
- `PUSH_SKILLS_SCRIPT`: optional, defaults to `/root/clawdbot/scripts/skills-git-push.sh`
