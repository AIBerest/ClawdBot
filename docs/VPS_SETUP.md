# Подключение ClawdBot к VPS

Пошаговая привязка проекта к вашему VPS.

## 1. Что нужно от VPS

- **IP или домен** сервера (например `123.45.67.89` или `clawdbot.example.com`)
- **Пользователь** (часто `root` или `ubuntu`)
- **Доступ**: по паролю или по SSH-ключу (ключ предпочтительнее)

## 2. Первое подключение по SSH

Если у вас ещё нет ключа:

```bash
# Сгенерировать ключ (если нет)
ssh-keygen -t ed25519 -C "clawdbot-vps" -f ~/.ssh/clawdbot_vps
```

Скопировать ключ на сервер (подставьте свой IP и пользователя):

```bash
ssh-copy-id -i ~/.ssh/clawdbot_vps.pub USER@IP_ИЛИ_ДОМЕН
```

Подключиться:

```bash
ssh -i ~/.ssh/clawdbot_vps USER@IP_ИЛИ_ДОМЕН
```

## 3. Настройка SSH для ClawdBot (одна команда входа)

Добавьте в `~/.ssh/config` блок для ClawdBot (скопируйте из `scripts/ssh-clawdbot.example`):

```
Host clawdbot
    HostName ВАШ_IP_ИЛИ_ДОМЕН
    User ВАШ_ПОЛЬЗОВАТЕЛЬ
    IdentityFile ~/.ssh/clawdbot_vps
    IdentitiesOnly yes
```

После этого подключение одной командой:

```bash
ssh clawdbot
```

## 4. Использование скриптов из репозитория

В корне проекта:

```bash
# Заполнить данные VPS (один раз)
cp .env.example .env
# Отредактируйте .env: VPS_HOST, VPS_USER, путь к ключу при необходимости

# Подключиться к VPS
./scripts/connect.sh

# Или указать хост явно
./scripts/connect.sh 123.45.67.89
```

## 5. Деплой кода на VPS (когда проект будет готов)

Скрипт `scripts/deploy.sh` синхронизирует проект на сервер (требует настроенный `Host clawdbot` в `~/.ssh/config` или переменные в `.env`).

```bash
./scripts/deploy.sh
```

## 6. OpenClaw на VPS

На сервере уже установлены **Node.js 22** и **OpenClaw** (github.com/openclaw/openclaw).

Чтобы завершить настройку (выбор модели, API-ключи, каналы), подключитесь и запустите интерактивный онбординг:

```bash
ssh clawdbot
openclaw onboard --install-daemon
```

Мастер проведёт через: порт Gateway, привязку (loopback/lan), провайдера (Anthropic, OpenAI и др.), API-ключи, при необходимости — каналы (Telegram, Discord и т.д.). Флаг `--install-daemon` ставит Gateway как сервис (systemd), чтобы он работал после выхода из SSH.

Полезные команды на VPS:

```bash
openclaw --version
openclaw gateway --port 18789 --verbose   # запуск Gateway вручную
openclaw doctor                           # проверка конфигурации
```

Документация: https://docs.openclaw.ai

---

**Важно:** не коммитьте файл `.env` с паролями и ключами — он уже добавлен в `.gitignore`.
