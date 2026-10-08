// Shared LAWMATE FIGlet branding module
// This is the official LAWMATE FIGlet banner used across all three standalone products
// Created as a single source of truth to avoid duplication

export const LAWMATE_FIGLET = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;

export function getLawmateBanner(): string {
  return LAWMATE_FIGLET;
}

export function getLawmateBannerCompact(): string {
  return `LAWMATE
MCP • CLI • AI API GATEWAY`;
}