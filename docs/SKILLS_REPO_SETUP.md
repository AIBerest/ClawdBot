# Один раз: настроить пуш в репозиторий скиллов

Токен в GitHub у тебя уже есть. Осталось сделать три вещи **на VPS**.

---

## Шаг 1. Зайти на сервер

На своём компьютере:

```bash
ssh clawdbot
```

(или `./scripts/connect.sh` из папки ClawdBot)

---

## Шаг 2. Клонировать репо скиллов на VPS (если ещё не клонировано)

На сервере выбери папку, где будет лежать репо скиллов, и клонируй **с токеном в URL** (подставь свой логин и токен):

```bash
# Пример: репо в домашней папке
cd ~
git clone https://ТВОЙ_ЛОГИН_GITHUB:ТВОЙ_ТОКЕН@github.com/ТВОЙ_ЛОГИН/имя-репо-скиллов.git skills
```

Например, если репо `https://github.com/aiassist/my-skills`:

```bash
git clone https://aiassist:ghp_xxxxxxxxxxxx@github.com/aiassist/my-skills.git skills
```

Папка `~/skills` — это и есть твой «путь к репо скиллов». Запомни его.

**Если репо уже склонирован** без токена — просто настрой remote, чтобы push шёл с токеном:

```bash
cd ~/skills   # или тот путь, где у тебя репо
git remote set-url origin https://ТВОЙ_ЛОГИН:ТВОЙ_ТОКЕН@github.com/ТВОЙ_ЛОГИН/имя-репо-скиллов.git
```

---

## Шаг 3. Указать этот путь в .env ClawdBot

На VPS открой или создай файл `~/clawdbot/.env` и добавь (подставь свой путь):

```bash
SKILLS_REPO_DIR=/home/твой_пользователь/skills
```

Узнать свой домашний каталог на VPS: `echo $HOME` — подставь его вместо `/home/твой_пользователь`.

Пример: если `$HOME` это `/root`, то:

```bash
SKILLS_REPO_DIR=/root/skills
```

Сохрани файл.

---

## Готово. Как пушить

**С твоего компьютера:**

```bash
ssh clawdbot '~/clawdbot/scripts/skills-git-push.sh "сообщение коммита"'
```

**Или зайди на VPS и выполни там:**

```bash
~/clawdbot/scripts/skills-git-push.sh "сообщение коммита"
```

Скрипт сделает в репо скиллов: `git add -A`, `git commit`, `git push`.

---

## Краткий чеклист

- [ ] Зашёл на VPS: `ssh clawdbot`
- [ ] Репо скиллов на VPS есть (клон с токеном в URL или remote с токеном)
- [ ] В `~/clawdbot/.env` указан `SKILLS_REPO_DIR=...` (полный путь к этой папке)
- [ ] Задеплоил ClawdBot с макa: `./scripts/deploy.sh` (чтобы на сервере был актуальный скрипт)
- [ ] Запустил пуш: `ssh clawdbot '~/clawdbot/scripts/skills-git-push.sh "тест"'`

Токен нужен только на VPS: в URL при `git clone` или в `git remote set-url`, чтобы `git push` мог авторизоваться в GitHub.
