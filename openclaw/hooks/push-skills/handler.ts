import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type HookEvent = {
  type: string;
  action: string;
  messages: string[];
  context?: {
    channelId?: string;
    senderId?: string;
    bodyForAgent?: string;
    content?: string;
  };
};

function getText(event: HookEvent): string {
  return (event.context?.bodyForAgent ?? event.context?.content ?? "").trim();
}

function parseCommand(text: string): { ok: boolean; message?: string } {
  // Accept: /push_skills [commit message...]
  // Also accept: push_skills [commit message...]
  const m = text.match(/^(?:\/)?push_skills(?:\s+(.+))?$/i);
  if (!m) return { ok: false };
  const msg = (m[1] ?? "").trim();
  return { ok: true, message: msg.length ? msg : undefined };
}

export default async function handler(event: HookEvent) {
  if (event.type !== "message" || event.action !== "preprocessed") return;

  const text = getText(event);
  const parsed = parseCommand(text);
  if (!parsed.ok) return;

  const allowedSenderId = process.env.PUSH_SKILLS_ALLOWED_SENDER_ID?.trim();
  const senderId = event.context?.senderId?.trim();

  if (!allowedSenderId) {
    event.messages.push(
      "push-skills: отказано\nPUSH_SKILLS_ALLOWED_SENDER_ID не задан",
    );
    return;
  }

  if (!senderId || senderId !== allowedSenderId) {
    event.messages.push("push-skills: отказано\nsender is not allowed");
    return;
  }

  const script = (process.env.PUSH_SKILLS_SCRIPT?.trim() ||
    "/root/clawdbot/scripts/skills-git-push.sh") as string;

  try {
    const args = parsed.message ? [parsed.message] : [];
    const { stdout, stderr } = await execFileAsync("bash", [script, ...args], {
      timeout: 10 * 60 * 1000,
      env: process.env,
    });

    const out = `${stdout ?? ""}\n${stderr ?? ""}`.trim();
    event.messages.push(out.length ? out : "push-skills: done");
  } catch (err: any) {
    const msg = (err?.stderr || err?.stdout || err?.message || String(err)).trim();
    event.messages.push(`push-skills: ошибка\n${msg}`);
  }
}
