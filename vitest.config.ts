import path from 'path';
import { defineConfig } from 'vitest/config';

const fromRoot = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['core/**/*.test.ts', 'infrastructure/**/*.test.ts', 'app/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    // mirrors "paths" from tsconfig.json, the most specific aliases go first
    alias: [
      { find: '@/appLayer', replacement: fromRoot('app/(appLayer)') },
      { find: '@/widgetsLayer', replacement: fromRoot('app/widgetsLayer') },
      { find: '@/featuresLayer', replacement: fromRoot('app/featuresLayer') },
      { find: '@/entitiesLayer', replacement: fromRoot('app/entitiesLayer') },
      { find: '@/sharedLayer', replacement: fromRoot('app/sharedLayer') },
      { find: '@', replacement: fromRoot('.') },
    ],
  },
});
