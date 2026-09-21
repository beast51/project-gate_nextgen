// // import 'app/styles/index.scss';

// export const StyleDecorator = (story: () => StoryFn): StoryFn => story();

import React, { ComponentType } from 'react';
import '@/appLayer/styles/index.scss';

export const StyleDecorator = (Story: ComponentType) => () => <Story />;
