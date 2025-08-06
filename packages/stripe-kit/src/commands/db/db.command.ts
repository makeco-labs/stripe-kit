import { Command } from 'commander';

import { purge } from './purge';
import { sync } from './sync';

export const db = new Command()
  .name('db')
  .description('Database operations')
  .addCommand(sync)
  .addCommand(purge)
  .action(() => {
    db.help();
    process.exit(0);
  });
