module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                "targets": "cover 99.5%",
                "modules": 'commonjs',
                "useBuiltIns": false,
            }
        ],
        "@babel/preset-typescript"
    ],
    plugins: [
        ['@babel/plugin-proposal-class-properties'],
        [
            "@babel/plugin-transform-runtime",
            {
                corejs: false,
                helpers: true,
                regenerator: true,
                useESModules: false
            }
        ]
    ]
}