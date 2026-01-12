import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;