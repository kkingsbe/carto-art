import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import '../app/globals.css';

export type HooksConfig = {
    // Add any custom hooks configuration here
};

beforeMount<HooksConfig>(async ({ hooksConfig }) => {
    // Add any global providers or setup here
    // This runs before each component is mounted
});
