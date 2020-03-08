const gulp = require('gulp');
const gulpBabel = require('./scripts/gulp-babel')
const gulpIf = require('gulp-if')
const rollup = require('rollup');
const { exec } = require('child_process');
const {
    resolve
} = require('path')
const resolveNode = require('rollup-plugin-node-resolve')
const ts = require("gulp-typescript");

const loadConfig = (type) => resolve(__dirname, `./scripts/cfg/babel.${type}.config.js`);

function mkCompiler(type) {
    return function () {
        return gulp.src(['src/**/*', '!src/**/types.ts'])
            .pipe(
                gulpIf(
                    file => /\.tsx?/.test(file.extname),
                    gulpBabel({
                        configFile: loadConfig(type)
                    })
                )
            ).pipe(gulp.dest(resolve(__dirname, `./npmpkg/${type}/`)))
    }
}
async function bundle() {
    const bundle = await rollup.rollup({
        input: './npmpkg/es/index.js',
        plugins: [resolveNode()]
    });
    await bundle.write({
        file: './docs/index.js',
        format: 'umd',
        name: 'webmark',
        sourcemap: false
    });
}

function tsd() {
    const tsResult = gulp.src("src/**/*")
        .pipe(ts({
            "noEmit": false,
            "declaration": true,
        }));
    return tsResult.dts
        .pipe(gulp.dest(resolve(__dirname, './npmpkg/es')))
        .pipe(gulp.dest(resolve(__dirname, './npmpkg/lib')))
};

function copy() {
    return gulp.src(['CHANGELOG.md', 'package.json', 'README.md', 'tsconfig.json'])
        .pipe(gulp.dest('./npmpkg/'))
}

function npmPublish(cb) {
    exec('npm publish', {cwd: resolve(process.cwd(), './npmpkg')} , (error, stdout, stderr) => {
        if (error) {
            console.error(`执行的错误: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          cb()
    })
}


gulp.task('build', gulp.series(
    gulp.parallel(
        mkCompiler('lib'),
        mkCompiler('es'),
        tsd,
    ),
    bundle
))
gulp.task('publish', gulp.series('build', copy, npmPublish))