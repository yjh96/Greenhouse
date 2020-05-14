const path = require('path');
const nodeExternals = require("webpack-node-externals");

module.exports = {
    mode : "development",
    entry : './C2D.js',
    node: {
        fs: "empty"
    },
    output : {
        filename : './C2D_BUNDLE.js',
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                        ]
                    }
                }
            },
        ]
    },
    externals: [ nodeExternals() ],
    target : "web"


}