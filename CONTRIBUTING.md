# Contributing to LAWMATE

## Overview

LAWMATE is an open-source legal AI platform built for Malaysian law firms. Contributions improve the reliability, safety, and usability of the system.

## How to Contribute

### 1. Fork and Clone

```bash
git clone https://github.com/LegaiAi-My/LAWMATE.git
cd LAWMATE
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# See .env.example for required variables (DATABASE_URL, REDIS_URL, OLLAMA_URL, etc.)

# Start infrastructure
docker compose up -d
```

### 3. Create Features

- **New Workers**: Add a new BullMQ worker in `src/workers/` implementing a queue consumer and business logic.
- **New Agents**: Extend the agent swarm in `src/agents/` with new capabilities.
- **Documentation**: Update `README.md`, `AGENTS.md`, and other docs to reflect changes.
- **Tests**: Add unit and integration tests for new functionality.

### 4. Follow Best Practices

- Write clean, modular code following the existing patterns
- Add type annotations and eslint checks
- Ensure all new code passes `npm run lint` and `npm run type-check`
- Update the changelog with a new version entry

### 5. Submit Changes

```bash
# Make your changes
# Run tests
npm run test:gold
npm run lint
npm run type-check

# Push to your fork
git add .
git commit -m "Your descriptive commit message"

# Create a pull request
# Ensure all CI checks pass
```

## Code Standards

- **Language**: TypeScript (strict mode enabled)
- **Style**: Follow the project's ESLint configuration
- **Formatting**: Use Prettier for code formatting
- **Testing**: Minimum 80% coverage for new code
- **Documentation**: Update README and inline comments as needed

## Reporting Bugs

1. Use the bug tracker or open a GitHub issue
2. Include steps to reproduce the issue
3. Provide expected vs actual behavior
4. Attach relevant logs or screenshots if applicable

## Code of Conduct

See [CODE_OF_CONDUCT.md](SECURITY.md) for community guidelines.

## License

LAWMATE is licensed under the MIT License.
