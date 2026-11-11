import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  root, configFile: false, publicDir: false,
  build: {
    outDir: 'public/invite', emptyOutDir: false, target: 'es2022', minify: 'oxc',
    lib: { entry: 'lib/ceremony-3d.js', formats: ['es'], fileName: () => 'ceremony-3d.js' },
  },
});
