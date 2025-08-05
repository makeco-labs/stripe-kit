import chalk from 'chalk';
import { listStripePrices } from '@/utils';

import type { Context } from '@/definitions';

/**
 * Lists Stripe prices
 */
export async function listStripePricesAction(
  ctx: Context,
  options: { showAll?: boolean } = {}
): Promise<void> {
  const { showAll = false } = options;
  
  try {
    const prices = await listStripePrices(ctx, { showAll });

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${prices.length} ${showAll ? '' : 'managed '}prices in Stripe:`);
    for (const price of prices) {
      const isManaged = price.metadata?.[ctx.config.metadata.priceIdField] &&
        price.metadata?.[ctx.config.metadata.managedByField] === ctx.config.metadata.managedByValue;
      
      console.log(chalk.green(`ID: ${chalk.bold(price.id)}`));
      console.log(`  Product: ${price.product}`);
      console.log(`  Active: ${price.active}`);
      console.log(`  Currency: ${price.currency.toUpperCase()}`);
      console.log(`  Type: ${price.type}`);

      if (price.type === 'recurring') {
        console.log(`  Interval: ${price.recurring?.interval}`);
        console.log(`  Interval Count: ${price.recurring?.interval_count}`);
      }

      if (typeof price.unit_amount === 'number') {
        console.log(
          `  Amount: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
        );
      }

      console.log(
        `  Internal ID: ${price.metadata?.[ctx.config.metadata.priceIdField] || 'N/A'}`
      );
      
      if (showAll) {
        console.log(`  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`);
      }
      
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}