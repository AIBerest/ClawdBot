#!/usr/bin/env bash
# Коммит и пуш в репозиторий скиллов.
# Использование:
#   Локально (через SSH):  ssh clawdbot '~/clawdbot/scripts/skills-git-push.sh [сообщение коммита]'
#   На VPS:                ~/clawdbot/scripts/skills-git-push.sh [сообщение коммита]
# Переменные в .env на сервере или при вызове: SKILLS_REPO_DIR, опционально SKILLS_REPO_BRANCH.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# На VPS подгружаем .env из деплоенной папки
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

SKILLS_REPO_DIR="${SKILLS_REPO_DIR:-}"
SKILLS_REPO_BRANCH="${SKILLS_REPO_BRANCH:-main}"
COMMIT_MSG="${1:-Update skills}"

if [[ -z "$SKILLS_REPO_DIR" ]]; then
  echo "Задайте путь к репозиторию скиллов: SKILLS_REPO_DIR=/path/to/skills-repo" >&2
  echo "В .env на VPS или: SKILLS_REPO_DIR=... $0 [сообщение коммита]" >&2
  exit 1
fi

if [[ ! -d "$SKILLS_REPO_DIR" ]]; then
  echo "Каталог не найден: $SKILLS_REPO_DIR" >&2
  exit 1
fi

cd "$SKILLS_REPO_DIR"
if [[ ! -d .git ]]; then
  echo "Не похоже на git-репозиторий: $SKILLS_REPO_DIR" >&2
  exit 1
fi

# Текущая ветка; при необходимости переключиться на целевую
CURRENT="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ -n "$SKILLS_REPO_BRANCH" && "$CURRENT" != "$SKILLS_REPO_BRANCH" ]]; then
  git checkout "$SKILLS_REPO_BRANCH" 2>/dev/null || true
fi

# Статус до изменений
STATUS="$(git status --porcelain)"
if [[ -z "$STATUS" ]]; then
  echo "Нет изменений в $SKILLS_REPO_DIR — пуш не нужен."
  exit 0
fi

git add -A
git commit -m "$COMMIT_MSG"
git push origin "${SKILLS_REPO_BRANCH:-HEAD}"
echo "Готово: коммит и пуш в репозиторий скиллов (ветка ${SKILLS_REPO_BRANCH})."
