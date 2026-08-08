import type { Preview } from '@storybook/react';
import '../../../packages/tokens/dist/tokens.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'todo' },
    viewport: {
      defaultViewport: 'mobile360',
      viewports: {
        mobile360: {
          name: 'Android mid-range',
          styles: { width: '360px', height: '740px' },
        },
      },
    },
  },
};

export default preview;
