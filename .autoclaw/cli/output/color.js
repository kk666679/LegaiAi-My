const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function colorize(text, color = 'reset') {
  const useColor = process.env.NO_COLOR === undefined && process.stdout.isTTY !== false;
  if (!useColor || !COLORS[color]) {
    return text;
  }
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

export function success(text) {
  return colorize(text, 'green');
}

export function error(text) {
  return colorize(text, 'red');
}

export function warn(text) {
  return colorize(text, 'yellow');
}

export function info(text) {
  return colorize(text, 'blue');
}
