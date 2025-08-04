import chalk from 'chalk';

// Handle SIGINT (Ctrl+C) gracefully with proper cleanup
let isExiting = false;

const gracefulExit = (code = 0) => {
  if (isExiting) {
    return;
  }
  isExiting = true;

  // Clean up any ongoing operations
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  console.log(chalk.yellow('\n👋 Operation cancelled by user'));

  // Give a moment for cleanup, then exit
  setTimeout(() => {
    process.exit(code);
  }, 100);
};

export function setupSignalHandlers() {
  process.on('SIGINT', () => gracefulExit(0));
  process.on('SIGTERM', () => gracefulExit(0));

  // Handle uncaught exceptions and unhandled rejections
  process.on(
    'uncaughtException',
    (error: Error & { code?: string; syscall?: string }) => {
      // Check if this is an EIO error from readline after SIGINT
      if (error.code === 'EIO' && error.syscall === 'read') {
        // This is likely from readline after SIGINT, ignore it
        gracefulExit(0);
        return;
      }
      console.error(chalk.red('\n❌ Uncaught exception:'), error.message);
      gracefulExit(1);
    }
  );

  process.on('unhandledRejection', (reason) => {
    console.error(chalk.red('\n❌ Unhandled rejection:'), reason);
    gracefulExit(1);
  });
}

export const onCancel = () => {
  gracefulExit(0);
};
