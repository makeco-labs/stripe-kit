import chalk from 'chalk';

import type { Context } from '@/definitions';

/**
 * Shows the Stripe dashboard URL
 */
export async function showStripeDashboardUrlAction(ctx: Context): Promise<void> {
  ctx.logger.info('Showing Stripe dashboard URL...');
  
  console.log(
    chalk.blue(
      'Stripe Dashboard URL: https://dashboard.stripe.com/test/products?active=true'
    )
  );
  
  ctx.logger.info('URL action completed successfully');
}