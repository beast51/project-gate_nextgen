import type { Preview } from "@storybook/react";
import '@fontsource/material-icons';
// import '../../app/(appLayer)/styles/index.scss'
import { ThemeDecorator } from "@/sharedLayer/config/storybook/ThemeDecorator/ThemeDecorator";
import { StyleDecorator } from "@/sharedLayer/config/storybook/StyleDecorator/StyleDecorator";
import { Theme } from "@/appLayer/providers/ThemeProvider/lib/ThemeContext";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      StyleDecorator(Story)()
    ),
    (Story) => {
      return (
      ThemeDecorator(Theme.LIGHT)(Story)
    )}
  ]
};

export default preview;
