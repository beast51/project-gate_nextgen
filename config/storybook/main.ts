import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: [
    "../../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../app/**/*.mdx"
  ],
  // controls, actions, viewport, backgrounds and interactions are part of the Storybook core since version 9
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
};
export default config;
