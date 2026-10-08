// cli/lib/banner.js
// LAWMATE unified FIGlet banner with plain-text fallback.
//
// IMPORTANT: never call this from an MCP stdio handler — stdout belongs
// to the JSON-RPC protocol there. Use printBanner() only in CLI/tty code.

const FIGLET = `
██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY
`.trimStart();

const PLAIN = `
LAWMATE
MCP • CLI • AI API GATEWAY
`.trimStart();

/** Should we render Unicode FIGlet?  Respects NO_COLOR and CI. */
function supportsUnicode() {
  if (process.env.NO_COLOR) return false;
  if (process.env.LAWMATE_PLAIN_BANNER === "1") return false;
  if (process.env.CI && process.env.LAWMATE_ASCII_BANNER !== "0") return false;
  // On Windows without UTF-8 codepage, FIGlet renders garbage.
  if (process.platform === "win32" && !process.env.WT_SESSION) return false;
  return true;
}

export function banner() {
  return supportsUnicode() ? FIGLET : PLAIN;
}

export function printBanner(stream = process.stdout) {
  stream.write(banner() + "\n\n");
}

export function printSubtitle(product, subtitle, stream = process.stdout) {
  stream.write(`${product}\n${subtitle}\n\n`);
}
