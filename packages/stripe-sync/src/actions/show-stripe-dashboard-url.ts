import chalk from 'chalk';

/**
 * Shows the Stripe dashboard URL
 */
export function showStripeDashboardUrl(): void {
  console.log(
    chalk.blue(
      'Stripe Dashboard URL: https://dashboard.stripe.com/test/products?active=true'
    )
  );
}
