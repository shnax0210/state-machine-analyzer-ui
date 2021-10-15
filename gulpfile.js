const browserify = require('browserify');
const babelify = require('babelify');
const replace = require('browserify-replace');

const source = require('vinyl-source-stream');
const gulp = require('gulp');

const fs = require('fs');

function escapeQuotes(str) {
    return str.split("`").join("\\`");
}

function processJs() {
    return browserify('src/js/main.jsx')
        .transform(replace, {
            replace: [{ from: /@ReadmeFileContent@/, to: escapeQuotes(fs.readFileSync('./README.md', 'utf8')) }]
        })
        .transform(babelify, {
            presets: ['@babel/preset-env', '@babel/preset-react']
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dest/js/'));
}

exports.build = gulp.series(processJs)
