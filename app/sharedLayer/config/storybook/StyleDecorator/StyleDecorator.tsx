// import { StoryFn } from '@storybook/react';
// import 'app/styles/index.scss';

// export const StyleDecorator = (story: () => StoryFn): StoryFn => story();

import React from 'react';
import '@/appLayer/styles/index.scss';
import { StoryFn } from '@storybook/react';

export const StyleDecorator = (Story: StoryFn) => () => <Story />;
