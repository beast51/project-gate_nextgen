// import { type Story } from '@storybook/react';
// import { type Theme } from '@/appLayer/providers/ThemeProvider/lib/ThemeContext';

// export const ThemeDecorator =
//   (theme: Theme) =>
//   (StoryComponent: Story): JSX.Element =>
//     (
//       <div className={`app ${theme}`}>
//         <StoryComponent />
//       </div>
//     );

//

// import { Story, StoryContext } from '@storybook/react';
// import { type Theme } from '@/appLayer/providers/ThemeProvider/lib/ThemeContext';

// export const ThemeDecorator =
//   (theme: Theme) => (StoryComponent: Story, context: StoryContext) =>
//     (
//       <div className={`app ${theme}`}>
//         <StoryComponent {...context} />
//       </div>
//     );

import { StoryFn } from '@storybook/react';
import { Theme } from '@/appLayer/providers/ThemeProvider/lib/ThemeContext';

export const ThemeDecorator =
  (theme: Theme) =>
  (StoryComponent: StoryFn): JSX.Element =>
    (
      <div
        style={{
          padding: '24px',
          // height: '100%',
          // width: '100%',
          // minHeight: 'initial',
          // background: 'initial',
        }}
        className={`app ${theme}`}
      >
        <StoryComponent />
      </div>
    );
