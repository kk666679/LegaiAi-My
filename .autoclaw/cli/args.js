export function parseArgs(argv) {
  const [, , command, subcommand, ...rest] = argv;
  let args = [];
  let flags = {};

  for (const token of rest) {
    if (token.startsWith('--')) {
      const [key, ...value] = token.slice(2).split('=');
      flags[key] = value.join('=') || true;
    } else if (token.startsWith('-') && token.length === 2) {
      flags[token.slice(1)] = true;
    } else {
      args.push(token);
    }
  }

  return { command, subcommand, args, flags };
}
