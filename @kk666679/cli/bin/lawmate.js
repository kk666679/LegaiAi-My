#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

let bannerFn = () => "LAWMATE\nMCP • CLI • AI API GATEWAY";
try {
  const mod = await import(path.join(__dirname, "..", "banner.js"));
  bannerFn = mod.banner ?? bannerFn;
} catch {
  /* banner module optional */
}

if (args.includes("--version") || args.includes("-v")) {
  console.log("1.0.0");
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(bannerFn());
  console.log();
  console.log("LAWMATE CLI");
  console.log("Developer Command Line");
  console.log();
  console.log("Usage: lawmate <command> [options]");
  console.log();
  console.log("Commands:");
  console.log("  login        Authenticate with LAWMATE");
  console.log("  logout       Clear stored credentials");
  console.log("  config       Manage configuration");
  console.log("  models       List available AI models");
  console.log("  ai           Chat with AI");
  console.log("  research     Legal research");
  console.log("  documents    Document operations");
  console.log("  jobs         Background jobs");
  console.log("  agents       Agent management");
  console.log("  mcp          MCP tools");
  console.log("  usage        Usage statistics");
  console.log();
  console.log("Options:");
  console.log("  --help, -h       Show this help");
  console.log("  --version, -v    Show version");
  console.log("  --json           Machine-readable output");
  process.exit(0);
}

console.error(`lawmate: unknown command: ${args[0]}`);
console.error("Run `lawmate --help` for usage.");
process.exit(1);
