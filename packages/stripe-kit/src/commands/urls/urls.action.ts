import chalk from 'chalk';
import prompts from 'prompts';

// ========================================================================
// STRIPE URL DEFINITIONS
// ========================================================================

interface StripeUrl {
  name: string;
  icon: string;
  live: string;
  test: string;
}

const STRIPE_URLS: StripeUrl[] = [
  {
    name: 'API Keys',
    icon: '🔑',
    live: 'https://dashboard.stripe.com/apikeys',
    test: 'https://dashboard.stripe.com/test/apikeys',
  },
  {
    name: 'Products',
    icon: '📦',
    live: 'https://dashboard.stripe.com/products',
    test: 'https://dashboard.stripe.com/test/products',
  },
  {
    name: 'Webhooks',
    icon: '🔗',
    live: 'https://dashboard.stripe.com/webhooks',
    test: 'https://dashboard.stripe.com/test/webhooks',
  },
];

// ========================================================================
// URL ACTIONS
// ========================================================================

// ------------------ Show All URLs ------------------

async function showAllUrls(): Promise<void> {
  console.log(chalk.blue.bold('\n🔗 Stripe Dashboard URLs:\n'));

  for (const urlItem of STRIPE_URLS) {
    console.log(chalk.cyan(`${urlItem.icon} ${chalk.bold(urlItem.name)}:`));
    console.log(chalk.green(`   Live: ${urlItem.live}`));
    console.log(chalk.yellow(`   Test: ${urlItem.test}`));
    console.log();
  }
}

// ------------------ Show URL Selection ------------------

async function showUrlSelection(): Promise<void> {
  try {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.blue('Select Stripe dashboard page:'),
      choices: STRIPE_URLS.map((urlItem) => ({
        title: `${urlItem.icon} ${urlItem.name}`,
        value: urlItem,
      })),
      initial: 0,
    });

    if (!response.value) {
      process.exit(0);
    }

    console.log(chalk.cyan(`\n${response.value.icon} ${response.value.name}:`));
    console.log(chalk.green(`   Live: ${response.value.live}`));
    console.log(chalk.yellow(`   Test: ${response.value.test}`));
  } catch (error) {
    console.error(chalk.red('Error during URL selection:'), error);
    process.exit(1);
  }
}

// ------------------ Main Action ------------------

export async function showStripeUrlsAction(options: {
  showAll: boolean;
}): Promise<void> {
  const { showAll } = options;

  if (showAll) {
    await showAllUrls();
  } else {
    await showUrlSelection();
  }
}
