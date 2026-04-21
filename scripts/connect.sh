#!/usr/bin/env bash
# Подключение к VPS ClawdBot.
# Использование: ./scripts/connect.sh [хост]
# Хост берётся из .env (VPS_HOST, VPS_USER) или из аргумента.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

VPS_HOST="${1:-$VPS_HOST}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/clawdbot_vps}"

if [[ -z "$VPS_HOST" ]]; then
  echo "Укажите хост: ./scripts/connect.sh IP_ИЛИ_ДОМЕН"
  echo "Или задайте VPS_HOST и VPS_USER в .env (см. .env.example)"
  exit 1
fi

OPTS=(-o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
if [[ -f "$SSH_KEY" ]]; then
  OPTS+=(-i "$SSH_KEY")
fi

echo "Подключение к $VPS_USER@$VPS_HOST ..."
exec ssh "${OPTS[@]}" "$VPS_USER@$VPS_HOST"
