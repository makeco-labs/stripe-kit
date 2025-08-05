import chalk from 'chalk';
import type { Context } from '@/definitions';
import { listStripeProducts } from '@/utils';

/**
 * Lists Stripe products
 */
export async function listStripeProductsAction(
  ctx: Context,
  options: { showAll?: boolean } = {}
): Promise<void> {
  const { showAll = false } = options;
  
  try {
    const products = await listStripeProducts(ctx, { showAll });

    if (products.length === 0) {
      ctx.logger.info('No products found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${products.length} ${showAll ? '' : 'managed '}products in Stripe:`);
    for (const product of products) {
      const isManaged = product.metadata?.[ctx.config.metadata.productIdField] &&
        product.metadata?.[ctx.config.metadata.managedByField] === ctx.config.metadata.managedByValue;
      
      console.log(chalk.green(`ID: ${chalk.bold(product.id)}`));
      console.log(`  Name: ${product.name}`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Description: ${product.description || 'N/A'}`);
      console.log(
        `  Internal ID: ${product.metadata?.[ctx.config.metadata.productIdField] || 'N/A'}`
      );
      
      if (showAll) {
        console.log(`  Managed: ${isManaged ? chalk.green('Yes') : chalk.yellow('No')}`);
      }
      
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}