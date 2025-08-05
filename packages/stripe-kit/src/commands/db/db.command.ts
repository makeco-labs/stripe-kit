import { Command } from 'commander';

import { purge } from './purge';

export const db = new Command()
  .name('db')
  .description('Database operations')
  .addCommand(purge)
  .action(() => {
    db.help();
    process.exit(0);
  });