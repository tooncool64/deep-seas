const path = require('path');

module.exports = [
    // Main process bundle
    {
        mode: 'development',
        target: 'electron-main',
        entry: './src/main.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'main.js'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    },
    // Renderer process bundle
    {
        mode: 'development',
        target: 'electron-renderer',
        entry: './src/renderer.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'renderer.js'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    }
];