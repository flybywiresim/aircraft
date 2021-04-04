'use strict';

const path = require('path');

module.exports = {
    entry: path.join(__dirname, 'index-web.tsx'),
    mode: 'development',
    devtool: 'source-map',
    devServer: { watchContentBase: true },
    resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
    output: { filename: 'index_bundle.js' },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
            },
            {
                test: /\.s?[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.(svg|png|woff2?|ttf|eof|eot)$/,
                loader: 'file-loader',
            },
        ],
    },
};
