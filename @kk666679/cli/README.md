# LAWMATE CLI

Developer command-line interface for LAWMATE.

## Installation

```bash
npm install @kk666679/cli
```

## Quick Start

```bash
# Show LAWMATE FIGlet banner
lawmate

# Show help
lawmate --help

# Show version
lawmate --version

# Suppress banner
lawmate --no-banner

# Run with environment variable
LAWMATE_NO_BANNER=1 lawmate
```

## Commands

| Command | Description |
|---------|-------------|
| `lawmate` | Show LAWMATE FIGlet banner and usage |
| `lawmate --help` | Show detailed help message |
| `lawmate --version` | Show version (LAWMATE CLI v1.0.0) |
| `lawmate --no-banner` | Suppress the FIGlet banner |
| `lawmate --json` | JSON output (no banner) |

## Features

- **LAWMATE FIGlet branding** displayed on startup and `--help`
- **`--no-banner`** flag and `LAWMATE_NO_BANNER=1` environment variable support
- **JSON output** support via `--json` flag (banner omitted)
- **Color support** using existing terminal color system
- **Terminal width detection** with compact fallback for narrow terminals
- **Unicode support detection** with ASCII fallback

## CLI Options

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version |
| `--no-banner`, `-b` | Suppress LAWMATE FIGlet banner |
| `--json` | Output as JSON (banner omitted) |
| `--verbose` | Enable verbose output |

## Development

```bash
npm install
npm run build
npm pack --dry-run
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LAWMATE_NO_BANNER=1` | Suppress the FIGlet banner |
| `LAWMATE_FORCE_UNICODE=1` | Force Unicode banner display |
| `LAWMATE_FORCE_COMPACT=1` | Force compact banner format |
| `LAWMATE_NO_COLOR=1` | Disable colorized output |

## Security

The CLI tool uses the LAWMATE FIGlet branding which is safe for all environments. The banner is designed to work in:
- macOS Terminal
- Linux terminals
- Windows Terminal
- CI logs
- Docker logs
- SSH sessions

The banner automatically falls back to compact format in non-interactive or narrow terminal environments.