# ClawdBot

Бот, привязанный к отдельному VPS.

## Подключение к VPS

1. Заполните данные сервера: `cp .env.example .env` и укажите `VPS_HOST`, `VPS_USER`.
2. Подключиться: `./scripts/connect.sh` или `./scripts/connect.sh IP_ИЛИ_ДОМЕН`.
3. Подробнее: [docs/VPS_SETUP.md](docs/VPS_SETUP.md).

## OpenClaw на VPS

На сервере установлен и **запущен** [OpenClaw](https://github.com/openclaw/openclaw): Gateway работает как сервис на порту 18789. Подключение: `ssh clawdbot`. Дальнейшие шаги (API-ключ, Telegram и др.) — в [docs/OPENCLAW_НА_СЕРВЕРЕ.md](docs/OPENCLAW_НА_СЕРВЕРЕ.md).

Для безопасного разнесения `ClawdBot` от других проектов на общем VPS используйте контейнерный вариант:

- план изоляции: [docs/SECURITY_ISOLATION.md](docs/SECURITY_ISOLATION.md)
- шаблон env: `.env.container.example`
- установка на VPS: `sudo bash scripts/install_container_on_vps.sh`

## Пуш в репозиторий скиллов

Скрипт `scripts/skills-git-push.sh` на VPS делает `git add`, `git commit` и `git push` в указанный репозиторий скиллов.

**Что сделать один раз (токен, клон, .env):** пошагово — [docs/SKILLS_REPO_SETUP.md](docs/SKILLS_REPO_SETUP.md).

Кратко:

1. На сервере в `~/clawdbot/.env` задайте путь к клону репо скиллов:
   ```bash
   SKILLS_REPO_DIR=/home/user/skills   # или ~/.codex/skills и т.п.
   SKILLS_REPO_BRANCH=main             # опционально, по умолчанию main
   ```
2. Запуск **с вашего компьютера** (после деплоя):
   ```bash
   ssh clawdbot '~/clawdbot/scripts/skills-git-push.sh "сообщение коммита"'
   ```
3. Или на самом VPS:
   ```bash
   ~/clawdbot/scripts/skills-git-push.sh "сообщение коммита"
   ```

Сообщение коммита можно не указывать — подставится `Update skills`. На сервере в репо скиллов должен быть настроен git (remote, при необходимости ключ для push).
