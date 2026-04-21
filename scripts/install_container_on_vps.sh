#!/usr/bin/env bash
# Install isolated ClawdBot/OpenClaw container runtime on a VPS.
# Run as root on the VPS after the repo is present:
#   sudo mkdir -p /srv/clawdbot
#   sudo rsync -az ./ /srv/clawdbot/app/
#   cd /srv/clawdbot/app
#   sudo bash scripts/install_container_on_vps.sh

set -euo pipefail

APP_ROOT="${APP_ROOT:-/srv/clawdbot/app}"
RUNTIME_ROOT="${RUNTIME_ROOT:-/srv/clawdbot/runtime}"
SERVICE_NAME="${SERVICE_NAME:-clawdbot-openclaw}"
UNIT_TEMPLATE="${APP_ROOT}/infra/systemd/${SERVICE_NAME}.service"
UNIT_DST="/etc/systemd/system/${SERVICE_NAME}.service"
CONFIG_DIR="${RUNTIME_ROOT}/openclaw-config"
WORKSPACE_DIR="${RUNTIME_ROOT}/openclaw-workspace"
SKILLS_DIR="${RUNTIME_ROOT}/skills-repo"
ENV_FILE="${APP_ROOT}/.env.container"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/install_container_on_vps.sh"
  exit 1
fi

if [[ ! -f "${APP_ROOT}/docker-compose.yml" ]]; then
  echo "Missing ${APP_ROOT}/docker-compose.yml"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

docker compose version >/dev/null

mkdir -p "${CONFIG_DIR}" "${WORKSPACE_DIR}" "${SKILLS_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  install -m 600 "${APP_ROOT}/.env.container.example" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.container.example"
  echo "Edit OPENCLAW_GATEWAY_TOKEN and PUSH_SKILLS_ALLOWED_SENDER_ID before exposing the bot."
else
  chmod 600 "${ENV_FILE}"
fi

if [[ ! -f "${CONFIG_DIR}/openclaw.json" ]]; then
  cat >"${CONFIG_DIR}/openclaw.json" <<'EOF'
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "controlUi": {
      "allowedOrigins": [
        "http://localhost:18789",
        "http://127.0.0.1:18789"
      ]
    }
  },
  "commands": {
    "restart": false
  },
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "off"
      }
    }
  }
}
EOF
fi

chown -R 1000:1000 "${CONFIG_DIR}" "${WORKSPACE_DIR}" "${SKILLS_DIR}"

if [[ ! -f "${UNIT_TEMPLATE}" ]]; then
  echo "Missing ${UNIT_TEMPLATE}"
  exit 1
fi

sed "s|__APP_ROOT__|${APP_ROOT}|g" "${UNIT_TEMPLATE}" >"${UNIT_DST}"

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service" || systemctl start "${SERVICE_NAME}.service"

echo ""
echo "Installed ${SERVICE_NAME}."
echo "  Env file:    ${ENV_FILE}"
echo "  Config dir:  ${CONFIG_DIR}"
echo "  Workspace:   ${WORKSPACE_DIR}"
echo "  Skills repo: ${SKILLS_DIR}"
echo "  Status:      systemctl status ${SERVICE_NAME}"
echo "  Logs:        docker logs -f clawdbot-openclaw"

