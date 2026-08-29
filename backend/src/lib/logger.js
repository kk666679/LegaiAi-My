const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

function agentLogger(agentName) {
  return logger.child({ agent: agentName })
}

module.exports = { logger, agentLogger }
