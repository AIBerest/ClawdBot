ARG OPENCLAW_BASE_IMAGE=ghcr.io/openclaw/openclaw:latest
FROM ${OPENCLAW_BASE_IMAGE}

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash git openssh-client curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/clawdbot

COPY openclaw /opt/clawdbot/openclaw
COPY scripts /opt/clawdbot/scripts

RUN node /opt/clawdbot/scripts/patch_openclaw_runtime.mjs /app/dist/get-reply-*.js

RUN chown -R 1000:1000 /opt/clawdbot

USER node
