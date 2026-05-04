#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const target = process.argv[2];

if (!target) {
  console.error("usage: patch_openclaw_runtime.mjs /app/dist/get-reply-*.js");
  process.exit(1);
}

const original = await readFile(target, "utf8");

const emitOriginal = `function emitPreAgentMessageHooks(params) {
\tif (params.isFastTestEnv) return;
\tconst sessionKey = normalizeOptionalString(params.ctx.SessionKey);
\tif (!sessionKey) return;
\tconst canonical = deriveInboundMessageHookContext(params.ctx);
\tif (canonical.transcript) fireAndForgetHook(triggerInternalHook(createInternalHookEvent("message", "transcribed", sessionKey, toInternalMessageTranscribedContext(canonical, params.cfg))), "get-reply: message:transcribed internal hook failed");
\tfireAndForgetHook(triggerInternalHook(createInternalHookEvent("message", "preprocessed", sessionKey, toInternalMessagePreprocessedContext(canonical, params.cfg))), "get-reply: message:preprocessed internal hook failed");
}`;

const emitPatched = `async function emitPreAgentMessageHooks(params) {
\tif (params.isFastTestEnv) return null;
\tconst sessionKey = normalizeOptionalString(params.ctx.SessionKey);
\tif (!sessionKey) return null;
\tconst canonical = deriveInboundMessageHookContext(params.ctx);
\tif (canonical.transcript) fireAndForgetHook(triggerInternalHook(createInternalHookEvent("message", "transcribed", sessionKey, toInternalMessageTranscribedContext(canonical, params.cfg))), "get-reply: message:transcribed internal hook failed");
\tconst hookEvent = createInternalHookEvent("message", "preprocessed", sessionKey, toInternalMessagePreprocessedContext(canonical, params.cfg));
\tawait triggerInternalHook(hookEvent);
\tconst hookContext = hookEvent.context;
\tif (hookContext && typeof hookContext === "object") {
\t\tconst nextContent = typeof hookContext.content === "string" ? hookContext.content : typeof hookContext.body === "string" ? hookContext.body : void 0;
\t\tconst nextBodyForAgent = typeof hookContext.bodyForAgent === "string" ? hookContext.bodyForAgent : nextContent;
\t\tif (typeof nextContent === "string") {
\t\t\tparams.ctx.Body = nextContent;
\t\t\tparams.ctx.RawBody = nextContent;
\t\t\tparams.ctx.CommandBody = nextContent;
\t\t\tparams.ctx.BodyForCommands = nextContent;
\t\t}
\t\tif (typeof nextBodyForAgent === "string") params.ctx.BodyForAgent = nextBodyForAgent;
\t\tif (typeof hookContext.transcript === "string") params.ctx.Transcript = hookContext.transcript;
\t\tif (typeof hookContext.senderId === "string") params.ctx.SenderId = hookContext.senderId;
\t\tif (typeof hookContext.senderName === "string") params.ctx.SenderName = hookContext.senderName;
\t\tif (typeof hookContext.senderUsername === "string") params.ctx.SenderUsername = hookContext.senderUsername;
\t}
\treturn hookEvent;
}`;

const callOriginal = `\temitPreAgentMessageHooks({
\t\tctx: finalized,
\t\tcfg,
\t\tisFastTestEnv
\t});
\tconst commandAuthorized = finalized.CommandAuthorized;`;

const callPatched = `\tconst preprocessedHookEvent = await emitPreAgentMessageHooks({
\t\tctx: finalized,
\t\tcfg,
\t\tisFastTestEnv
\t});
\tif (preprocessedHookEvent?.context?.shortCircuitReply === true || preprocessedHookEvent?.context?.skipReply === true) return { text: typeof preprocessedHookEvent?.context?.replyText === "string" ? preprocessedHookEvent.context.replyText : "NO_REPLY" };
\tconst commandAuthorized = finalized.CommandAuthorized;`;

let patched = original;

if (!patched.includes(emitOriginal)) {
  console.error("patch failed: emitPreAgentMessageHooks block not found");
  process.exit(1);
}

patched = patched.replace(emitOriginal, emitPatched);

if (!patched.includes(callOriginal)) {
  console.error("patch failed: emitPreAgentMessageHooks callsite not found");
  process.exit(1);
}

patched = patched.replace(callOriginal, callPatched);

if (patched === original) {
  console.error("patch failed: file unchanged");
  process.exit(1);
}

await writeFile(target, patched);
console.log(`patched ${target}`);
