import chalk from 'chalk';
import type { Context } from '@/definitions';
import { listStripePrices } from '@/utils';

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

    ctx.logger.info(
      `Found ${prices.length} ${showAll ? '' : 'managed '}prices in Stripe:`
    );
    for (const price of prices) {
      const isManaged =
        price.metadata?.[ctx.config.metadata.priceIdField] &&
        price.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(price.id)}`);
      console.log(`  ${chalk.dim('Product:')} ${price.product}`);
      console.log(`  ${chalk.dim('Active:')} ${price.active}`);
      console.log(
        `  ${chalk.dim('Currency:')} ${price.currency.toUpperCase()}`
      );
      console.log(`  ${chalk.dim('Type:')} ${price.type}`);

      if (price.type === 'recurring') {
        console.log(`  ${chalk.dim('Interval:')} ${price.recurring?.interval}`);
        console.log(
          `  ${chalk.dim('Interval Count:')} ${price.recurring?.interval_count}`
        );
      }

      if (typeof price.unit_amount === 'number') {
        console.log(
          `  ${chalk.dim('Amount:')} ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
        );
      }

      console.log(
        `  ${chalk.dim('Internal ID:')} ${price.metadata?.[ctx.config.metadata.priceIdField] || 'N/A'}`
      );

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`
        );
      }

      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}
