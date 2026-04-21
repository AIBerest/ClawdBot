#!/usr/bin/env bash
# Деплой проекта на VPS (синхронизация файлов).
# Требуется: Host clawdbot в ~/.ssh/config ИЛИ .env с VPS_HOST, VPS_USER.
# Использование: ./scripts/deploy.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

# Сначала пробуем короткое имя из ssh config
REMOTE="${DEPLOY_REMOTE:-clawdbot}"
if [[ -n "$VPS_HOST" ]]; then
  REMOTE="${VPS_USER:-root}@${VPS_HOST}"
fi

RSYNC_EXCLUDE=(
  --exclude '.git'
  --exclude 'node_modules'
  --exclude '.env'
  --exclude '__pycache__'
  --exclude '*.pyc'
  --exclude '.venv'
  --exclude 'venv'
  --exclude 'logs'
  --exclude '.DS_Store'
)

echo "Деплой на $REMOTE ..."
rsync -avz --delete "${RSYNC_EXCLUDE[@]}" ./ "$REMOTE:~/clawdbot/"

echo "Готово. Подключиться: ssh $REMOTE"
