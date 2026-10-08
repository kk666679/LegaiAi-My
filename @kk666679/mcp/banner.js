// cli/banner.js
// LAWMATE unified banner. Plain-text fallback for narrow terminals/CI.
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

function supportsUnicode() {
  if (process.env.NO_COLOR) return false;
  if (process.env.LAWMATE_PLAIN_BANNER === "1") return false;
  if (process.env.CI && process.env.LAWMATE_ASCII_BANNER !== "0") return false;
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

export default { banner, printBanner, printSubtitle };
