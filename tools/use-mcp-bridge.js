#!/usr/bin/env node
// Rewrites the Lens Studio-generated .mcp.json so Claude Code reaches the
// lens-studio MCP server through tools/ls-mcp-bridge.js. Run from the project
// root again whenever Lens Studio regenerates .mcp.json. Never prints the token.

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", ".mcp.json");
const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
const entry = cfg.mcpServers["lens-studio"];
if (entry.type === "stdio") {
  console.log(".mcp.json already uses the bridge");
  process.exit(0);
}
cfg.mcpServers["lens-studio"] = {
  type: "stdio",
  command: "node",
  args: [path.join(__dirname, "ls-mcp-bridge.js").split("\\").join("/")],
  env: {
    LS_MCP_URL: entry.url.replace("localhost", "127.0.0.1"),
    LS_MCP_AUTH: entry.headers.Authorization,
  },
};
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log(`.mcp.json now bridges to ${cfg.mcpServers["lens-studio"].env.LS_MCP_URL}`);
