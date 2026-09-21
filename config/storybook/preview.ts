import type { Preview } from "@storybook/nextjs";
import '@fontsource/material-icons';
// import '../../app/(appLayer)/styles/index.scss'
import { ThemeDecorator } from "@/sharedLayer/config/storybook/ThemeDecorator/ThemeDecorator";
import { StyleDecorator } from "@/sharedLayer/config/storybook/StyleDecorator/StyleDecorator";
import { Theme } from "@/appLayer/providers/ThemeProvider/lib/ThemeContext";

const preview: Preview = {
  // a documentation page is generated for every component with stories
  tags: ['autodocs'],
  parameters: {
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
