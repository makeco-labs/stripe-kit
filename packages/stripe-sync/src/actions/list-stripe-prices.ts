import chalk from 'chalk';
import type { Context } from '@/types';
import { fetchStripePrices } from './stripe-fetch-utils';

/**
 * Lists Stripe prices
 */
export async function listStripePrices(ctx: Context): Promise<void> {
  try {
    const prices = await fetchStripePrices(ctx);

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${prices.length} prices in Stripe:`);
    for (const price of prices) {
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
        `  Internal ID: ${price.metadata?.internal_price_id || 'N/A'}`
      );
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}
