const path = require('path');
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
// const nodeExternals = require('webpack-node-externals');

module.exports = {

    // Path to your entry point. From this file Webpack will begin its work
    entry: './index.js',
  
    // Path and filename of your result bundle.
    // Webpack will bundle all JavaScript into this file
    output: {
        path: path.resolve(__dirname, 'html'),
        publicPath: '',
        filename: 'bundle.js'
    },
  
    // Default mode for Webpack is production.
    // Depending on mode Webpack will apply different things
    // on the final bundle. For now, we don't need production's JavaScript 
    // minifying and other things, so let's set mode to development
    mode: 'development',

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use:    {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    
    // only needed for webpack 5, cuz 
    // polyfills have been removed
    // plugins: [
    //     new NodePolyfillPlugin()
    // ],

    // only for backend projects,
    // externals: [
    //     nodeExternals()
    // ],
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    }
  };