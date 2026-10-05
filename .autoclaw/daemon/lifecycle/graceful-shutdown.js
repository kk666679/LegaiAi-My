export function setupGracefulShutdown({ daemon, signals = ['SIGTERM', 'SIGINT'] }) {
  let shuttingDown = false;

  for (const signal of signals) {
    process.on(signal, async () => {
      if (shuttingDown) {
        console.warn(`[daemon] Second ${signal} received, forcing exit`);
        process.exit(1);
      }

      shuttingDown = true;
      console.log(`[daemon] Received ${signal}, shutting down gracefully...`);

      try {
        await daemon.stop({ timeoutMs: 30000 });
        console.log('[daemon] Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('[daemon] Shutdown error:', error.message);
        process.exit(1);
      }
    });
  }

  process.on('uncaughtException', async (error) => {
    console.error('[daemon] Uncaught exception:', error);
    try {
      await daemon.stop({ timeoutMs: 5000 });
    } catch {
      // Ignore errors during emergency shutdown
    }
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('[daemon] Unhandled rejection:', reason);
    try {
      await daemon.stop({ timeoutMs: 5000 });
    } catch {
      // Ignore errors during emergency shutdown
    }
    process.exit(1);
  });
}
