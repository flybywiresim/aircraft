'use strict';

const esbuild = require('esbuild');
const path = require('path');
const { copy } = require('esbuild-plugin-copy');

const rootDir = path.join(__dirname, '..', '..', '..');
const outFile = 'out/flybywire-aircraft-a320-neo/html_ui/JS/fmgc/fmgc.js';

const isProductionBuild = process.env.A32NX_PRODUCTION_BUILD === '1';

esbuild.build({
    absWorkingDir: __dirname,

    plugins: [
        copy({
            assets: {
                // This is required because the copy plugin excepts `from` to be relative to `process.cwd()` - and fails silently on Windows paths
                from: path.relative(process.cwd(), path.join(__dirname, 'src/utils/LzUtf8.js')).replaceAll('\\', '/'),
                to: 'LzUtf8.js',
            },
        }),
    ],

    define: { DEBUG: 'false' },

    entryPoints: ['src/index.ts'],
    bundle: true,
    treeShaking: true,
    minify: isProductionBuild,

    outfile: path.join(rootDir, outFile),

    format: 'iife',
    globalName: 'Fmgc',

    sourcemap: isProductionBuild ? undefined : 'linked',

    // Target approximate CoherentGT WebKit version
    target: 'safari11',
});
