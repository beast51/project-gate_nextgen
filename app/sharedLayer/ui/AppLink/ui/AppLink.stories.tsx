import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { AppLink } from './AppLink';
import { ThemeDecorator } from '@/sharedLayer/config/storybook/ThemeDecorator/ThemeDecorator';
import { Theme } from '@/appLayer/providers/ThemeProvider/lib/ThemeContext';

const meta = {
  title: 'sharedLayer/AppLink',
  component: AppLink,
  parameters: {
    layout: 'center',
  },
  // tags: ['autodocs'],
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} satisfies Meta<typeof AppLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Link',
    href: '',
  },
};

export const PrimaryDark: Story = {
  decorators: [(Story) => ThemeDecorator(Theme.DARK)(Story)],
  args: {
    variant: 'primary',
    children: 'Link',
    href: '',
  },
};
