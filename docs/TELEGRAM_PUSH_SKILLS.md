# Пуш скиллов по команде из Telegram

Цель: написать в Telegram **`/push_skills`** и получить commit+push в GitHub из репозитория скиллов на VPS.

## Что уже должно быть

- Репо скиллов на VPS (например `/root/skillsC`) и оно пушится в GitHub (remote настроен).
- В `~/clawdbot/.env` задан `SKILLS_REPO_DIR=/root/skillsC`.
- На VPS есть скрипт `~/clawdbot/scripts/skills-git-push.sh` (после `./scripts/deploy.sh` с Mac).

## Установка хука на VPS

1) Подключись к VPS:

```bash
ssh clawdbot
```

2) Скопируй хук в managed hooks OpenClaw:

```bash
mkdir -p ~/.openclaw/hooks
rm -rf ~/.openclaw/hooks/push-skills
cp -R ~/clawdbot/openclaw/hooks/push-skills ~/.openclaw/hooks/push-skills
```

3) Разреши запуск только себе.

Нужно узнать `senderId` в Telegram. Самый простой способ:
- включить bundled hook `command-logger` или посмотреть логи сообщений (если у тебя они включены),
- или временно добавить вывод `senderId` в хук (если надо — скажешь, добавлю).

Когда `senderId` известен, задай переменную окружения для сервиса gateway.

Если gateway запущен как user-service systemd (как в твоих заметках), добавь override:

```bash
mkdir -p ~/.config/systemd/user/openclaw-gateway.service.d
cat > ~/.config/systemd/user/openclaw-gateway.service.d/env.conf <<'EOF'
[Service]
Environment=PUSH_SKILLS_ALLOWED_SENDER_ID=PASTE_TELEGRAM_SENDER_ID_HERE
Environment=PUSH_SKILLS_SCRIPT=/root/clawdbot/scripts/skills-git-push.sh
EOF
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway
```

4) Включи хук и перезапусти gateway:

```bash
openclaw hooks list
openclaw hooks enable push-skills
systemctl --user restart openclaw-gateway
```

## Использование (в Telegram)

- `/push_skills`
- `/push_skills обновил скиллы`

Хук ответит в чат выводом скрипта. Если изменений нет — будет сообщение, что пуш не нужен.

## Если не срабатывает

На VPS проверь:

```bash
openclaw hooks list --verbose
openclaw hooks info push-skills
systemctl --user status openclaw-gateway
```

Частые причины:
- `PUSH_SKILLS_ALLOWED_SENDER_ID` не задан → хук откажется выполнять команду
- указан не тот `senderId`
- в репо скиллов нет изменений
