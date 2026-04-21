# Security Isolation Plan

Цель: вынести `ClawdBot` + `OpenClaw` в отдельное окружение на VPS и убрать полный доступ к `polymarket-bot` и `Trade Bot`.

## Что видно по локальной конфигурации

### ClawdBot

- Текущая документация ориентируется на запуск OpenClaw как user-level systemd service в домашнем каталоге сервера.
- Хук `push-skills` запускает shell-скрипт и поэтому должен видеть только выделенный репозиторий скиллов, а не весь VPS.
- Если контейнеру выдать `docker.sock`, это практически root-доступ к хосту. Для жёсткой изоляции `ClawdBot` это недопустимо.

### polymarket-bot

- Уже имеет гораздо более правильную модель для VPS:
  - отдельный системный пользователь `polybot`
  - отдельный каталог `/opt/polymarket-bot`
  - отдельный systemd service
  - базовый hardening через `NoNewPrivileges`, `ProtectSystem`, `PrivateTmp`
- Это хороший ориентир для остальных проектов.

### Trade Bot

- В локальной папке нет `.git`, значит проект, скорее всего, ещё не опубликован как полноценный git-репозиторий из этой директории.
- `docker-compose.yml` публикует Postgres `5432` и Redis `6379` на все интерфейсы хоста. На общем VPS это лишний риск, если нет firewall-ограничения.
- Скрипты `dev-up.sh` / `smoke.sh` выглядят как dev-окружение, а не как production deployment.

## Рекомендованная целевая раскладка на VPS

### 1. Разнести проекты по владельцам и путям

- `ClawdBot`: `/srv/clawdbot/app` + `/srv/clawdbot/runtime/*`
- `polymarket-bot`: `/opt/polymarket-bot`
- `Trade Bot`: `/opt/trade-bot`

Для каждого проекта:

- отдельный Unix-пользователь или отдельный контейнерный runtime
- отдельный `.env`
- отдельные логи
- отдельные systemd units / docker compose stacks
- никаких общих writable-каталогов

### 2. Изоляция ClawdBot

`ClawdBot` должен работать в Docker и видеть только:

- `/home/node/.openclaw`
- `/home/node/.openclaw/workspace`
- отдельный клон репозитория скиллов, если нужен `push-skills`

`ClawdBot` не должен получать:

- bind-mount на `/opt/polymarket-bot`
- bind-mount на `/opt/trade-bot`
- `/var/run/docker.sock`
- SSH-ключи хоста
- доступ к `/root`

### 3. Изоляция polymarket-bot

Оставить как отдельный host-level сервис под `polybot`, но проверить на VPS:

- владелец каталога `/opt/polymarket-bot` должен быть `polybot:polybot`
- `.env` должен быть `600`
- unit должен работать как `User=polybot`
- другие пользователи не должны иметь write-доступ к каталогу

### 4. Изоляция Trade Bot

Если `Trade Bot` тоже будет жить на этом же VPS, ему нужен свой контур:

- git-репозиторий
- отдельный Unix-пользователь, например `tradebot`
- отдельный каталог `/opt/trade-bot`
- отдельный docker compose stack или systemd unit
- Postgres и Redis либо только на internal network, либо хотя бы на `127.0.0.1`

Без этого `Trade Bot` остаётся dev-раскладкой и не соответствует production-isolation.

## Что добавлено в этот репозиторий

- `Dockerfile` для контейнерного запуска `OpenClaw` с нужными утилитами для hook-скриптов
- `docker-compose.yml` с жёсткими ограничениями:
  - `read_only: true`
  - `cap_drop: [ALL]`
  - `no-new-privileges`
  - публикация gateway только на `127.0.0.1`
- `.env.container.example` для runtime-переменных
- `scripts/install_container_on_vps.sh` для установки на VPS
- `infra/systemd/clawdbot-openclaw.service` для root-managed docker compose

## Важные security-решения

### OpenClaw sandbox

По документации OpenClaw sandbox часто использует Docker. Для этого обычно нужен доступ к Docker runtime. Если смонтировать Docker socket в контейнер `ClawdBot`, контейнер сможет создавать другие контейнеры на хосте и потенциально получить доступ ко всем трём проектам.

Поэтому в базовой схеме:

- sandbox для `ClawdBot` выключен
- `docker.sock` не монтируется
- управление контейнером делает root через systemd, а не приложение

### Доступ к gateway

Gateway публикуется только на loopback:

- `127.0.0.1:18789`

Подключение:

- через SSH tunnel
- или через отдельно настроенный reverse proxy с auth

Не открывать этот порт наружу напрямую без отдельного слоя аутентификации и firewall.

## Что проверить вручную на VPS после миграции

### ClawdBot

```bash
systemctl status clawdbot-openclaw
docker inspect clawdbot-openclaw --format '{{json .Mounts}}'
docker exec clawdbot-openclaw sh -lc 'ls -la /opt || true; ls -la /srv || true'
docker logs --tail 100 clawdbot-openclaw
```

Ожидаемо:

- в mounts нет `/opt/polymarket-bot`
- в mounts нет `/opt/trade-bot`
- нет `/var/run/docker.sock`

### polymarket-bot

```bash
systemctl status polymarket-bot
namei -om /opt/polymarket-bot
stat -c '%U %G %a %n' /opt/polymarket-bot /opt/polymarket-bot/.env
```

### Trade Bot

```bash
namei -om /opt/trade-bot
docker ps --format 'table {{.Names}}\t{{.Ports}}'
ss -ltnp | grep -E '5432|6379|3000|8001'
```

Ожидаемо:

- сервисы `Trade Bot` не торчат наружу без необходимости
- Postgres/Redis не открыты на `0.0.0.0`, если это не осознанное решение

## Нерешённые вопросы

- Из этой среды VPS сейчас недоступен: SSH до `83.147.192.66:22` уходит в timeout.
- Пока не подтверждено фактическое состояние каталогов, прав и запущенных сервисов на сервере.
- `Trade Bot` стоит оформить как полноценный git-репозиторий до production rollout.

