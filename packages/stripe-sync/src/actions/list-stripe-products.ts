import chalk from 'chalk';

import type { Context, WithClient } from '../types';
import { fetchStripeProducts } from './stripe-fetch-utils';

/**
 * Lists Stripe products
 */
export async function listStripeProducts(ctx: WithClient<Context>): Promise<void> {
  try {
    const products = await fetchStripeProducts(ctx);

    if (products.length === 0) {
      ctx.logger.info('No products found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${products.length} products in Stripe:`);
    for (const product of products) {
      console.log(chalk.green(`ID: ${chalk.bold(product.id)}`));
      console.log(`  Name: ${product.name}`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Description: ${product.description || 'N/A'}`);
      console.log(
        `  Internal ID: ${product.metadata?.internal_product_id || 'N/A'}`
      );
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}