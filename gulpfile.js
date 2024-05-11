import gulp from "gulp";
import replace from "gulp-replace";
import * as nodePath from 'path';
import { deleteAsync } from "del";
import fileinclude from "gulp-file-include";
import browserSync from "browser-sync";
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import cleanCSS from 'gulp-clean-css';
import autoPrefixer from "gulp-autoprefixer";
import rename from "gulp-rename";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import newer from 'gulp-newer'

//paths
const rootFolder = nodePath.basename(nodePath.resolve())

const buildFolder = `./dist`;
const srcFolder = `./src`;

const path = {
    build: {
        img: `${buildFolder}/img/`,
        js: `${buildFolder}/js/`,
        css: `${buildFolder}/css/`,
        html: `${buildFolder}/`,
        files: `${buildFolder}/files/`,
    },
    src: {
        img: `${srcFolder}/img/**/*`,
        svg: `${srcFolder}/img/**/*.svg`,
        js: `${srcFolder}/js/app.js`,
        scss: `${srcFolder}/scss/style.scss`,
        html: `${srcFolder}/*.html`,
        files: `${srcFolder}/files/**/*.*`,
    },
    watch: {
        img: `${srcFolder}/img/**/*`,
        js: `${srcFolder}/js/**/*.js`,
        scss: `${srcFolder}/scss/**/*.scss`,
        html: `${srcFolder}/**/*.html`,
        files: `${srcFolder}/files/**/*.*`,
    },
    clean: buildFolder,
    buildFolder: buildFolder,
    srcFolder: srcFolder,
    rootFolder: rootFolder,
    ftp: ``
}

//tasks
const reset = () => {
    return deleteAsync(path.clean);
} //delete files to dist

const html = () => {
    return gulp.src(path.src.html)
        .pipe(fileinclude())
        .pipe(replace(/@img\//g, 'img/'))
        .pipe(gulp.dest(path.build.html))
        .pipe(browserSync.stream());  
} //build html files

const scss = () => {
    return gulp.src(path.src.scss, { sourcemaps: true })
        .pipe(replace(/@img\//g, '../img/'))
        .pipe(sass({
            outputStyle: 'expanded',
        }))
        .pipe(autoPrefixer({
            grid: true,
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(cleanCSS()) 
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(browserSync.stream());
};  //build css file

const js = () => {
    return gulp.src(path.src.js, { sourcemaps: true })
        .pipe(gulpWebpack({
            mode: 'development',
            output: {
                filename: 'app.min.js',
            }
        }, webpack))
        .pipe(gulp.dest(path.build.js))
        .pipe(browserSync.stream());
} //build js file

const img = () => {
    return gulp.src(path.src.img, {encoding: false})
        .pipe(newer(path.build.img))
        .pipe(webp())
        .pipe(gulp.dest(path.build.img))
        .pipe(gulp.src(path.src.img, {encoding: false}))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3 //0...7

        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(gulp.src(path.src.svg))
        .pipe(gulp.dest(path.build.img))
        .pipe(browserSync.stream())
}

const server = (done) => {
    browserSync.init({
        server: {
            baseDir: `${path.build.html}`
        },
        port: 3000
    })
} //Local server

//watcher
function watcher() {
    gulp.watch(path.watch.html, html)
    gulp.watch(path.watch.scss, scss)
    gulp.watch(path.watch.js, js)
    gulp.watch(path.watch.img, img)
}

//scripts
const mainTasks = gulp.parallel(html, scss, js, img);
const dev = gulp.series(reset, mainTasks, gulp.parallel(watcher, server));
const build = gulp.series(reset, mainTasks);

gulp.task('default', dev);
gulp.task('build', build);
