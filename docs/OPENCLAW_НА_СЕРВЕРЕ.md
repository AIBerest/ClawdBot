# OpenClaw на сервере — что уже сделано

## Открыто и запущено

- **OpenClaw Gateway** установлен и работает как сервис (systemd).
- Слушает: `ws://127.0.0.1:18789` (и `ws://[::1]:18789`).
- Конфиг: `~/.openclaw/openclaw.json` на сервере.
- Рабочая папка: `~/.openclaw/workspace`.

Подключиться к серверу:
```bash
ssh clawdbot
```

Полезные команды на сервере:
```bash
# Статус Gateway
systemctl --user status openclaw-gateway

# Запуск / остановка
systemctl --user start openclaw-gateway
systemctl --user stop openclaw-gateway

# Проверка настроек
openclaw doctor
openclaw --version
```

## Что сделать дальше (по желанию)

1. **API-ключ для модели**  
   Сейчас модель: `anthropic/claude-opus-4-6`, ключ не задан. Чтобы бот отвечал, добавьте ключ:
   ```bash
   ssh clawdbot
   openclaw config set anthropic.apiKey YOUR_ANTHROPIC_KEY
   systemctl --user restart openclaw-gateway
   ```
   Или через онбординг с ключом: [документация](https://docs.openclaw.ai/start/wizard-cli-automation).

2. **Канал (Telegram / Discord и т.д.)**  
   Чтобы писать боту из мессенджера:
   - Telegram: создайте бота у @BotFather, затем на сервере:
     ```bash
     openclaw channels telegram set-token YOUR_BOT_TOKEN
     systemctl --user restart openclaw-gateway
     ```
   - Другие каналы: https://docs.openclaw.ai/channels

3. **Доступ с вашего компьютера**  
   Сейчас Gateway слушает только localhost на сервере. Чтобы подключаться с Mac:
   - Вариант А: туннель SSH:
     ```bash
     ssh -L 18789:127.0.0.1:18789 clawdbot
     ```
     затем на Mac в браузере или клиенте использовать `localhost:18789`.
   - Вариант Б: настроить привязку на `0.0.0.0` и фаервол (см. [Remote access](https://docs.openclaw.ai/gateway/remote)).

Документация: https://docs.openclaw.ai
