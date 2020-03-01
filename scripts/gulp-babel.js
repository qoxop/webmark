const through = require('through2')
const babel = require('@babel/core')
const Vinyl = require('vinyl')

const objFilter = (obj, filterFn) => {
    return Object.keys(obj).reduce((newObj, key) => {
        if (filterFn(obj[key], key)) {
            newObj[key] = obj[key];
        }
        return newObj;
    }, {})
}

const babelTransform = (code, options = {}) => {
    return babel.transformAsync(code === 'string' ? code : code.toString(), options)
}

const defaultOptions = {
    babelrc: true,
    sourceMaps: false,
    compact: false,
    minified: false,
}

module.exports = function(babelOptions) {
    babelOptions = objFilter(
        Object.assign({}, defaultOptions, (babelOptions || {})),
        value => (value !== undefined)
    )
    if (typeof babelOptions.configFile === 'string') {
        babelOptions.babelrc = false;
    }
    return through.obj(function (vinyl = new Vinyl(), enc, callback) {
        babelTransform(vinyl.contents, Object.assign({filename: vinyl.path}, babelOptions)).then(({code, map}) => {
            vinyl.contents = Buffer.from(code);
            vinyl.extname = '.js';
            if (babelOptions.sourceMaps === true && !!map) {
                const mapVinyl = vinyl.clone({contents: false, deep: false});
                mapVinyl.contents = Buffer.from(map.file);
                mapVinyl.extname = '.js.map';
                this.push(mapVinyl);
            }
            this.push(vinyl);
            callback()
        })
    })
}