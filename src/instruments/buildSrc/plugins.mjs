import fs from 'fs';
import { join } from 'path';
import image from '@rollup/plugin-image';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel as babelPlugin } from '@rollup/plugin-babel';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from 'tailwindcss';
import dotenv from 'dotenv';
import { Directories } from './directories.mjs';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

dotenv.config();

function babel() {
    return babelPlugin({
        presets: [
            ['@babel/preset-env', { targets: { safari: '11' } }],
            ['@babel/preset-react', { runtime: 'automatic' }],
            ['@babel/preset-typescript'],
        ],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            ['@babel/plugin-transform-runtime', { regenerator: true }],
            ['module-resolver', { alias: { '@flybywiresim/failures': '../src/failures' } }],
        ],
        babelHelpers: 'runtime',
        compact: false,
        extensions,
    });
}

function postCss(_, instrumentFolder) {
    let plugins;

    const tailwindConfigPath = join(Directories.instruments, 'src', instrumentFolder, 'tailwind.config.js');

    if (fs.existsSync(tailwindConfigPath)) {
        plugins = [
            tailwindcss(tailwindConfigPath),
        ];
    } else {
        plugins = [
            tailwindcss(undefined),
        ];
    }

    return postcss({
        use: { sass: {} },
        plugins,
        extract: 'bundle.css',
    });
}

export function baseCompile(instrumentName, instrumentFolder) {
    return [
        image(),
        nodeResolve({ extensions }),
        commonjs({ include: /node_modules/ }),
        babel(),
        typescriptPaths({
            tsConfigPath: join(Directories.src, 'tsconfig.json'),
            preserveExtensions: true,
        }),
        replace({
            'DEBUG': 'false',
            'preventAssignment': true,
            'process.env.NODE_ENV': JSON.stringify('production'),
            'process.env.CLIENT_ID': JSON.stringify(process.env.CLIENT_ID),
            'process.env.CLIENT_SECRET': JSON.stringify(process.env.CLIENT_SECRET),
            'process.env.CHARTFOX_SECRET': JSON.stringify(process.env.CHARTFOX_SECRET),
            'process.env.SIMVAR_DISABLE': 'false',
        }),
        postCss(instrumentName, instrumentFolder),
    ];
}
