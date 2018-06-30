var gulp = require('gulp');
// 簡化 gulp 載入流程，用$取代gulp開頭套件
var $ = require('gulp-load-plugins')();
// 轉換jade為html檔
// var jade = require('gulp-jade');
// // 轉換scss為css檔
// var sass = require('gulp-sass');
// // 讓 Gulp 在運行的過程中遇錯不會中斷
// var plumber = require('gulp-plumber');
// //  CSS 後處理器
// var postcss = require('gulp-postcss');
// // 自動為你的 CSS 補上前綴詞
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
//   讓網頁自動更新
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence')

// 利用minimist控制是否壓縮css,js
var envOption = {
    string: 'env',
    default: { env: 'develop'}
}

var options = minimist(process.argv.slice(2), envOption);

// 刪除資料夾
gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], {read: false})
        .pipe($.clean());
});


gulp.task('copyHTML', function(){
    return gulp.src('./source/**/*.jade')
    .pipe(gulp.dest('./public/'))
})

gulp.task('jade', function() {
    gulp.src('./source/**/*.jade')
    // 讓 Gulp 在運行的過程中遇錯不會中斷
      .pipe($.plumber())
      .pipe($.jade({
      }))
      .pipe(gulp.dest('./public/'))
    //   讓網頁自動重新整理
      .pipe(browserSync.stream());
  });

gulp.task('sass', function () {
    var plugins = [
        // 決定最新的幾個版本，可以再autoprefixer的網站中找到主流的幾個版本決定方式
        autoprefixer({browsers: ['last 2 version']})
    ];
    return gulp.src('./source/scss/**/*.scss')
    // 讓 Gulp 在運行的過程中遇錯不會中斷
      .pipe($.plumber())
      .pipe($.sass().on('error', $.sass.logError))
    // css處理  
      .pipe($.postcss(plugins))
    //   壓縮css
      .pipe($.if(options.env ==='production', $.cleanCss()))
      .pipe(gulp.dest('./public/css'))
      //   讓網頁自動重新整理
      .pipe(browserSync.stream());
  });

// gulp-babel為JavaScript ES6 編譯工具，gulp-sourcemaps會顯示原始碼來源位置，gulp-concat整合檔案
gulp.task('babel', () =>{
gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['env']
    }))
    // 合併js
    .pipe($.concat('all.js'))
    // 壓縮js
    .pipe($.if(options.env ==='production', $.uglify({
        compress:{
            drop_console:true
        }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    //   讓網頁自動重新整理
    .pipe(browserSync.stream());
});


// gulp跟bower串聯
gulp.task('bower', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors'))
});

// 將bower內抓出的js轉移到public
gulp.task('vendorJs', ['bower'] ,function(){
    return gulp.src('./.tmp/vendors/**/**.js')
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env ==='production', $.uglify()))
        .pipe(gulp.dest('./public/js'))
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        },
        reloadDebounce: 5000
    });
});

// 將圖片轉換至public
gulp.task('image-min', () =>
    gulp.src('./source/images/*')
    // 是否壓縮圖片
        .pipe($.if(options.env ==='production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
);

// 持續監聽修改的內容，隨修改內容不斷更新
gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
  });

// 
gulp.task('deploy', function() {
return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJs'))

// 合併多個任務
gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'browser-sync', 'image-min', 'watch']);