const gulp = require('gulp');
const gulpBabel = require('./scripts/gulp-babel')
const gulpIf = require('gulp-if')
const rollup = require('rollup');
const {resolve} = require('path')
const resolveNode = require('rollup-plugin-node-resolve')
const loadConfig = (type) => resolve(__dirname, `./scripts/cfg/babel.${type}.config.js`);

function mkCompiler(type) {
    return function() {
        return gulp.src(['src/**/*', '!src/**/types.ts'])
            .pipe(
                gulpIf(
                    file => /\.tsx?/.test(file.extname),
                    gulpBabel({configFile: loadConfig(type)})
                )
            ).pipe(gulp.dest(resolve(__dirname, `./${type}/`)))
    }
}
async function bundle() {
    const bundle = await rollup.rollup({
        input: './es/index.js',
        plugins: [resolveNode()]
      });
      await bundle.write({
        file: './index.js',
        format: 'umd',
        name: 'webmk',
        sourcemap: false
      });
}

module.exports.default = gulp.series(
    gulp.parallel(
        mkCompiler('lib'),
        mkCompiler('es')
    ),
    bundle
)