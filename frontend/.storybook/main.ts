import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "..\\public"
  ],
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');
    const path = await import('path');

    return mergeConfig(config, {
      resolve: {
        alias: {
          '@/lib/actions/events': path.resolve(process.cwd(), '__mocks__/lib/actions/events.ts'),
          '@/lib/actions/subscription': path.resolve(process.cwd(), '__mocks__/lib/actions/subscription.ts'),
          '@/lib/stripe/client': path.resolve(process.cwd(), '__mocks__/lib/stripe/client.ts'),
          'stripe': path.resolve(process.cwd(), '__mocks__/stripe.ts'),
          '@stripe/stripe-js': path.resolve(process.cwd(), '__mocks__/@stripe/stripe-js.ts'),
        },
      },
    });
  }
};
export default config;