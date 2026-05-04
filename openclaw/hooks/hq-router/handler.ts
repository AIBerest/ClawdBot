type HookEvent = {
  type: string;
  action: string;
  messages: string[];
  context?: {
    channelId?: string;
    conversationId?: string;
    to?: string;
    senderId?: string;
    body?: string;
    bodyForAgent?: string;
    content?: string;
    shortCircuitReply?: boolean;
    skipReply?: boolean;
    replyText?: string;
  };
};

type ConversationInfo = {
  chat_id?: string;
  topic_id?: string;
  group_subject?: string;
  sender_id?: string;
};

type RouteKey = "crypto" | "content" | "agent" | "build" | "ops";

type RouteSpec = {
  key: RouteKey;
  chatId: string;
  label: string;
  reason: string;
};

const OPENCLAW_CONFIG_PATH =
  process.env.HQ_ROUTER_OPENCLAW_CONFIG_PATH?.trim() ||
  "/home/node/.openclaw/openclaw.json";

const ROUTE_LABELS: Record<RouteKey, string> = {
  crypto: "10 — Crypto Desk",
  content: "20 — Content Studio",
  agent: "30 — Agent Lab",
  build: "40 — Build / Coding",
  ops: "50 — Ops / Tasks",
};

const MARKER_ROUTES: Array<{ pattern: RegExp; key: RouteKey; reason: string }> = [
  { pattern: /(^|\n)\s*РАЗБОР\s*:/i, key: "crypto", reason: "marker: РАЗБОР" },
  { pattern: /(^|\n)\s*ПОСТ\s*:/i, key: "content", reason: "marker: ПОСТ" },
  {
    pattern: /(^|\n)\s*АРХИТЕКТУРА\s*:/i,
    key: "agent",
    reason: "marker: АРХИТЕКТУРА",
  },
  { pattern: /(^|\n)\s*КОД\s*:/i, key: "build", reason: "marker: КОД" },
  { pattern: /(^|\n)\s*ПЛАН\s*:/i, key: "ops", reason: "marker: ПЛАН" },
];

const KEYWORD_ROUTES: Array<{ key: RouteKey; reason: string; keywords: string[] }> = [
  {
    key: "crypto",
    reason: "keywords: crypto/market",
    keywords: [
      "btc",
      "eth",
      "alts",
      "altcoin",
      "рынок",
      "крипт",
      "ликвид",
      "уровн",
      "сетап",
      "watchlist",
      "catalyst",
      "макро",
      "narrative",
      "polymarket",
    ],
  },
  {
    key: "content",
    reason: "keywords: content/post",
    keywords: [
      "пост",
      "тред",
      "thread",
      "headline",
      "заголов",
      "редакт",
      "rewrite",
      "упаков",
      "digest",
      "дайджест",
      "telegram post",
      "twitter",
      "x post",
    ],
  },
  {
    key: "agent",
    reason: "keywords: agents/skills",
    keywords: [
      "агент",
      "skill",
      "skills",
      "prompt",
      "router",
      "routing",
      "memory",
      "workflow",
      "orchestration",
      "model selection",
      "openclaw",
      "clawdbot",
      "архитект",
    ],
  },
  {
    key: "build",
    reason: "keywords: code/build",
    keywords: [
      "код",
      "debug",
      "bug",
      "ssh",
      "docker",
      "api",
      "json",
      "yaml",
      "python",
      "javascript",
      "typescript",
      "config",
      "deploy",
      "server",
      "vps",
      "env",
    ],
  },
  {
    key: "ops",
    reason: "keywords: ops/plan",
    keywords: [
      "задач",
      "приоритет",
      "план",
      "статус",
      "focus",
      "next action",
      "weekly",
      "today",
      "roadmap",
      "blocker",
      "дедлайн",
    ],
  },
];

function getText(event: HookEvent): string {
  return (
    event.context?.bodyForAgent ??
    event.context?.content ??
    event.context?.body ??
    ""
  ).trim();
}

function normalizeChatId(raw?: string): string | undefined {
  if (!raw) return undefined;
  let value = raw.trim();
  for (const prefix of ["telegram:", "group:", "chat:"]) {
    if (value.startsWith(prefix)) value = value.slice(prefix.length);
  }
  return value || undefined;
}

function extractPlainBody(text: string): string {
  const parts = text.split("\n```\n\n");
  return (parts[parts.length - 1] || text).trim();
}

function extractConversationInfo(text: string): ConversationInfo {
  const m = text.match(
    /Conversation info \(untrusted metadata\):\n```json\n([\s\S]*?)\n```/,
  );
  if (!m) return {};
  try {
    return JSON.parse(m[1]) as ConversationInfo;
  } catch {
    return {};
  }
}

function extractSenderId(event: HookEvent, info: ConversationInfo): string | undefined {
  const raw = event.context?.senderId?.trim();
  if (raw) return normalizeChatId(raw);
  return normalizeChatId(info.sender_id);
}

function getRouteConfig(): Record<RouteKey, string> {
  return {
    crypto: process.env.HQ_ROUTER_CRYPTO_CHAT_ID?.trim() || "",
    content: process.env.HQ_ROUTER_CONTENT_CHAT_ID?.trim() || "",
    agent: process.env.HQ_ROUTER_AGENT_CHAT_ID?.trim() || "",
    build: process.env.HQ_ROUTER_BUILD_CHAT_ID?.trim() || "",
    ops: process.env.HQ_ROUTER_OPS_CHAT_ID?.trim() || "",
  };
}

function classifyRoute(text: string): { key: RouteKey; reason: string } | undefined {
  const explicitRoutePatterns: Array<{ pattern: RegExp; key: RouteKey; reason: string }> =
    [
      {
        pattern: /(^|\n)\s*Куда\s*:\s*10\s*[—-]\s*Crypto Desk/i,
        key: "crypto",
        reason: "explicit destination: 10 — Crypto Desk",
      },
      {
        pattern: /(^|\n)\s*Куда\s*:\s*20\s*[—-]\s*Content Studio/i,
        key: "content",
        reason: "explicit destination: 20 — Content Studio",
      },
      {
        pattern: /(^|\n)\s*Куда\s*:\s*30\s*[—-]\s*Agent Lab/i,
        key: "agent",
        reason: "explicit destination: 30 — Agent Lab",
      },
      {
        pattern: /(^|\n)\s*Куда\s*:\s*40\s*[—-]\s*Build\s*\/\s*Coding/i,
        key: "build",
        reason: "explicit destination: 40 — Build / Coding",
      },
      {
        pattern: /(^|\n)\s*Куда\s*:\s*50\s*[—-]\s*Ops\s*\/\s*Tasks/i,
        key: "ops",
        reason: "explicit destination: 50 — Ops / Tasks",
      },
    ];

  for (const route of explicitRoutePatterns) {
    if (route.pattern.test(text)) {
      return { key: route.key, reason: route.reason };
    }
  }

  for (const marker of MARKER_ROUTES) {
    if (marker.pattern.test(text)) {
      return { key: marker.key, reason: marker.reason };
    }
  }

  let best: { key: RouteKey; score: number; reason: string } | undefined;
  const lowered = text.toLowerCase();

  for (const group of KEYWORD_ROUTES) {
    const score = group.keywords.reduce(
      (sum, keyword) => sum + (lowered.includes(keyword) ? 1 : 0),
      0,
    );
    if (!score) continue;
    if (!best || score > best.score) {
      best = { key: group.key, score, reason: group.reason };
    }
  }

  if (!best || best.score < 2) return undefined;
  return { key: best.key, reason: best.reason };
}

function buildHandoffMessage(text: string, route: RouteSpec): string {
  const body = extractPlainBody(text);
  return [
    `Тип задачи: handoff из HQ`,
    `Куда: ${route.label}`,
    `Маршрут: ${route.label}`,
    `Причина: ${route.reason}`,
    "Следующий шаг: взять задачу в работу в этом чате",
    "",
    "───",
    "",
    "[HANDOFF]",
    `Куда: ${route.label}`,
    "Контекст:",
    body || "(пустое сообщение)",
    "[/HANDOFF]",
  ].join("\n");
}

async function readBotTokenFromConfig(): Promise<string | undefined> {
  try {
    const raw = await readFile(OPENCLAW_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      channels?: { telegram?: { botToken?: string } };
    };
    const token = parsed.channels?.telegram?.botToken?.trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

async function getBotToken(): Promise<string | undefined> {
  const envToken = process.env.HQ_ROUTER_BOT_TOKEN?.trim();
  if (envToken) return envToken;
  return readBotTokenFromConfig();
}

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`telegram send failed: ${response.status} ${body}`);
  }
}

export default async function handler(event: HookEvent) {
  if (event.type !== "message" || event.action !== "preprocessed") return;
  if (event.context?.channelId !== "telegram") return;

  const sourceChatId = normalizeChatId(process.env.HQ_ROUTER_SOURCE_CHAT_ID?.trim());
  if (!sourceChatId) return;

  const text = getText(event);
  const conversation = extractConversationInfo(text);
  const chatId =
    normalizeChatId(conversation.chat_id) ||
    normalizeChatId(event.context?.conversationId) ||
    normalizeChatId(event.context?.to);
  if (!chatId || chatId !== sourceChatId) return;

  const allowedSenderId = normalizeChatId(
    process.env.HQ_ROUTER_ALLOWED_SENDER_ID?.trim(),
  );
  const senderId = extractSenderId(event, conversation);
  const hasReliableUserSender = !!senderId && !senderId.startsWith("group:");
  if (allowedSenderId && hasReliableUserSender && senderId !== allowedSenderId) return;

  const classified = classifyRoute(text);
  if (!classified) return;

  const chatMap = getRouteConfig();
  const destinationChatId = normalizeChatId(chatMap[classified.key]);
  if (!destinationChatId) {
    event.messages.push(
      `hq-router: не настроен chat id для ${ROUTE_LABELS[classified.key]}`,
    );
    return;
  }

  if (destinationChatId === chatId) return;

  const route: RouteSpec = {
    key: classified.key,
    chatId: destinationChatId,
    label: ROUTE_LABELS[classified.key],
    reason: classified.reason,
  };

  const token = await getBotToken();
  if (!token) {
    event.messages.push("hq-router: bot token не найден");
    return;
  }

  try {
    await sendTelegramMessage(token, route.chatId, buildHandoffMessage(text, route));
    event.context = {
      ...(event.context ?? {}),
      content: "NO_REPLY",
      bodyForAgent: "NO_REPLY",
      shortCircuitReply: true,
      skipReply: true,
      replyText: "NO_REPLY",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    event.messages.push(`hq-router: ошибка\n${message}`);
  }
}
