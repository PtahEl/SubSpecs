#!/usr/bin/env node
// stdio <-> HTTP bridge for the Lens Studio MCP server.
//
// Lens Studio 5.24.1's MCP server replies with "Transfer-Encoding: chunked" but
// writes the body without chunk framing, so strict HTTP clients (Node/undici,
// curl, Claude Code) reject every response. This bridge speaks MCP over stdio,
// forwards each JSON-RPC message over a raw TCP socket with "Connection: close",
// and reads the body until the socket ends, tolerating both framed and unframed
// bodies.
//
// Config (env): LS_MCP_URL  (default http://127.0.0.1:50041/mcp)
//               LS_MCP_AUTH (value for the Authorization header)
// No dependencies; nothing is downloaded or executed.

const net = require("net");
const readline = require("readline");

const url = new URL(process.env.LS_MCP_URL || "http://127.0.0.1:50041/mcp");
const auth = process.env.LS_MCP_AUTH || "";
let sessionId = null;

function log(...a) {
  process.stderr.write("[ls-mcp-bridge] " + a.join(" ") + "\n");
}

function decodeChunked(buf) {
  const out = [];
  let i = 0;
  while (i < buf.length) {
    const eol = buf.indexOf("\r\n", i);
    if (eol < 0) return null;
    const size = parseInt(buf.slice(i, eol).toString("latin1").split(";")[0], 16);
    if (Number.isNaN(size)) return null;
    if (size === 0) return Buffer.concat(out);
    out.push(buf.slice(eol + 2, eol + 2 + size));
    i = eol + 2 + size + 2;
  }
  return Buffer.concat(out);
}

function post(body) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(body, "utf8");
    const headers = [
      `POST ${url.pathname} HTTP/1.1`,
      `Host: ${url.host}`,
      "Content-Type: application/json",
      "Accept: application/json, text/event-stream",
      `Content-Length: ${payload.length}`,
      "Connection: close",
    ];
    if (auth) headers.push(`Authorization: ${auth}`);
    if (sessionId) headers.push(`Mcp-Session-Id: ${sessionId}`);

    const sock = net.connect(Number(url.port) || 80, url.hostname);
    let raw = Buffer.alloc(0);
    let done = false;
    const finish = (closed) => {
      if (done) return;
      const res = parseResponse(raw, closed);
      if (!res) return;
      done = true;
      sock.destroy();
      if (res instanceof Error) reject(res);
      else resolve(res);
    };
    sock.on("connect", () => sock.write(headers.join("\r\n") + "\r\n\r\n" + body));
    // Lens Studio ignores "Connection: close" and never terminates the body, so
    // the response is considered complete as soon as it parses.
    sock.on("data", (d) => {
      raw = Buffer.concat([raw, d]);
      finish(false);
    });
    sock.on("error", (e) => {
      if (!done) (done = true), reject(e);
    });
    sock.on("close", () => finish(true));
  });
}

// Returns the parsed response, null if more bytes are needed, or an Error.
function parseResponse(raw, closed) {
  const sep = raw.indexOf("\r\n\r\n");
  if (sep < 0) return closed ? new Error("no HTTP headers in response") : null;
  const head = raw.slice(0, sep).toString("latin1").split("\r\n");
  const status = Number(head[0].split(" ")[1]);
  const hdr = {};
  for (const line of head.slice(1)) {
    const k = line.indexOf(":");
    if (k > 0) hdr[line.slice(0, k).trim().toLowerCase()] = line.slice(k + 1).trim();
  }
  const contentType = hdr["content-type"] || "";
  let payloadBuf = raw.slice(sep + 4);
  if (hdr["content-length"] !== undefined) {
    const len = Number(hdr["content-length"]);
    if (payloadBuf.length < len && !closed) return null;
    payloadBuf = payloadBuf.slice(0, len);
  } else if (/chunked/i.test(hdr["transfer-encoding"] || "")) {
    const decoded = decodeChunked(payloadBuf);
    if (decoded) payloadBuf = decoded; // otherwise the body was sent unframed
  }
  const text = payloadBuf.toString("utf8");
  if (!closed && !isComplete(status, contentType, text)) return null;
  if (hdr["mcp-session-id"]) sessionId = hdr["mcp-session-id"];
  return { status, contentType, text };
}

function isComplete(status, contentType, text) {
  if (status === 202 || status === 204) return true;
  if (!text.trim()) return false;
  try {
    if (/event-stream/i.test(contentType)) {
      if (!/\r?\n\r?\n\s*$/.test(text)) return false;
      sseMessages(text);
    } else {
      JSON.parse(text);
    }
    return true;
  } catch {
    return status >= 400 && !/json|event-stream/i.test(contentType);
  }
}

function sseMessages(text) {
  const out = [];
  for (const ev of text.split(/\r?\n\r?\n/)) {
    const data = ev.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n");
    if (data) out.push(JSON.parse(data));
  }
  return out;
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function relay(text, contentType) {
  if (!text.trim()) return;
  if (/event-stream/i.test(contentType)) {
    sseMessages(text).forEach(emit);
  } else {
    const parsed = JSON.parse(text);
    for (const m of Array.isArray(parsed) ? parsed : [parsed]) emit(m);
  }
}

const pending = new Set();
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const p = handle(line).finally(() => pending.delete(p));
  pending.add(p);
});
// Let in-flight requests finish before exiting when the client closes stdin.
rl.on("close", () => Promise.allSettled([...pending]).then(() => process.exit(0)));

async function handle(line) {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return log("ignoring non-JSON input");
  }
  try {
    const res = await post(line);
    if (res.status >= 400 && msg.id !== undefined) {
      emit({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `Lens Studio HTTP ${res.status}: ${res.text.slice(0, 200)}` } });
      return;
    }
    relay(res.text, res.contentType);
  } catch (e) {
    log("request failed:", e.message);
    if (msg.id !== undefined) {
      emit({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `Lens Studio MCP unreachable at ${url.href}: ${e.message}` } });
    }
  }
}
