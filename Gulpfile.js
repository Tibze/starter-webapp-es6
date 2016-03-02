var gulp = require('gulp');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var htmlreplace = require('gulp-html-replace');
var mainBowerFiles = require('main-bower-files');
var gulpSequence = require('gulp-sequence');
var gulpif = require('gulp-if');
var del = require('del');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

var config = {
  // Production mode is disabled when running default task (dev mode)
  PRODUCTION: true,
  // Development server port
  PORT: 3000,
  // Relative paths to sources and output directories
  BOWER: './bower_components',
  DIR: 'app/',
  SRC_DIR: 'app/src/',
  SASS_DIR: 'app/sass/',
  ASSETS_DIR: 'app/assets/',
  MAIN_SASS_FILE : 'index.scss',
  BUILD_DIR: 'app/.tmp/',
  IMAGE_DIR: 'images/',
  DIST: 'dist/',
  DIST_DIR_JS: 'dist/js/',
  DIST_DIR_CSS: 'dist/css/',
  DIST_DIR_ASSETS: 'dist/assets/',
  VENDOR_JS_NAME : 'vendors.js',
  VENDOR_CSS_NAME : 'vendors.css',
  SCRIPTS_JS_NAME: 'scripts.js',
  STYLES_CSS_NAME: 'styles.css',

  root: function(path) {
    return this.DIR + path;
  },
  src: function(path) {
    return this.SRC_DIR + path;
  },
  sass: function(path) {
    return this.SASS_DIR + path;
  },
  assets: function(path) {
    return this.ASSETS_DIR + path;
  },
  images: function(path) {
    return this.ASSETS_DIR + this.IMAGE_DIR + path;
  },      
  dist: function(path) {
    return this.DIST + path;
  },    
  destJS: function(path) {
    return this.BUILD_DIR_JS + path;
  },
  destCSS: function(path) {
    return this.BUILD_DIR_CSS + path;
  }  
};

// FUNCTIONS

function errorAlertSASS(error){
    notify.onError({title: "SASS Error", message: error.Message, sound: "Pop"})(error); //Error Notification
    console.log(error.toString());//Prints Error to Console
    this.emit("end"); //End function
}; 

function errorAlertJS(error){
    notify.onError({title: "JS Error", message: error.Message, sound: "Pop"})(error); //Error Notification
    console.log(error.toString());//Prints Error to Console
    this.emit("end"); //End function
};

/* Install & Concat all css vendors [main] from BOWER files */
gulp.task('vendor-css', function() {
    var cssRegEx = (/.*\.css$/i);
    return gulp.src(mainBowerFiles({filter: cssRegEx}), {base: config.BOWER})
        .pipe(
          gulpif(config.PRODUCTION, minifyCSS())
        )    
        .pipe(concat(config.VENDOR_CSS_NAME))
        .pipe(
          gulpif(!config.PRODUCTION, gulp.dest(config.BUILD_DIR))
        )
        .pipe(
          gulpif(config.PRODUCTION, gulp.dest(config.DIST_DIR_CSS))
        )
});

/* Install & Concat all js vendors [main] from BOWER files */
gulp.task('vendor-js', function() {
    var jsRegEx = (/.*\.js$/i);
    return gulp.src(mainBowerFiles({filter: jsRegEx}), {base: config.BOWER})
        .pipe(concat(config.VENDOR_JS_NAME))
        .pipe(
          gulpif(config.PRODUCTION, uglify())
        )        
        .pipe(
          gulpif(!config.PRODUCTION, gulp.dest(config.BUILD_DIR))
        )
        .pipe(
          gulpif(config.PRODUCTION, gulp.dest(config.DIST_DIR_JS))
        )
});

gulp.task('scripts', function () {
  return gulp.src(config.src('**/*.js'))
    .pipe(plumber({errorHandler: errorAlertJS})) 
    .pipe(babel({
            presets: ['babel-preset-es2015']
        }))
    .pipe(concat(config.SCRIPTS_JS_NAME))
    .pipe(
      gulpif(config.PRODUCTION, uglify())
    )    
    .pipe(
      gulpif(!config.PRODUCTION, gulp.dest(config.BUILD_DIR))
    )
    .pipe(
      gulpif(config.PRODUCTION, gulp.dest(config.DIST_DIR_JS))
    )
    .pipe(
      gulpif(!config.PRODUCTION, browserSync.reload({ stream: true }))
    );    
});

gulp.task('styles', function() 
{
    return gulp.src(config.SASS_DIR+config.MAIN_SASS_FILE)
    .pipe(plumber({errorHandler: errorAlertSASS}))   
    .pipe(sass())
    .pipe(
      gulpif(config.PRODUCTION, minifyCSS())
    )    
    .pipe(concat(config.STYLES_CSS_NAME))
    .pipe(
      gulpif(!config.PRODUCTION, gulp.dest(config.BUILD_DIR))
    )
    .pipe(
      gulpif(config.PRODUCTION, gulp.dest(config.DIST_DIR_CSS))
    )        
    .pipe(
      gulpif(!config.PRODUCTION, browserSync.reload({ stream: true }))
    );    

});

gulp.task('html', function() {
  return gulp.src(config.root('index.html'))
    .pipe(
      gulpif(config.PRODUCTION, htmlreplace({
        'css': 'css/styles.css',
        'js': ['js/vendors.js','js/scripts.js']
    })))
    .pipe(
      gulpif(config.PRODUCTION, gulp.dest(config.DIST))
    )    
    .pipe(
      gulpif(!config.PRODUCTION, browserSync.reload({ stream: true }))
    );
});

gulp.task('copy-assets', function() {
  return gulp.src([config.assets('**/*'),'!'+config.assets('images')]).pipe(gulp.dest(config.DIST_DIR_ASSETS));
});

gulp.task('optimize-images', function () {
        return gulp.src(config.images('*'))
          .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
          }))
          .pipe(gulp.dest(config.DIST_DIR_ASSETS+config.IMAGE_DIR));
});

gulp.task('clean', function (cb) {
        return del(config.DIST, cb);
});

gulp.task('notify', function () {
        return gulp.src("")
        .pipe(notify({ message: 'Build Success'}));
});

gulp.task('dev', function() {
  config.PRODUCTION = false; 
});

/* Start webserver and activate watchers */
gulp.task('server', ['run'], function() {
  browserSync({
    port: config.PORT,
    server: {
      baseDir: config.DIR
    }
  });

  gulp.watch([config.src('**/*.js')], ['scripts']);
  gulp.watch(config.sass('**/*.scss'), ['styles']);
  gulp.watch(config.root('index.html'), ['html']);
})


/* Build task - production mode */
gulp.task('run', ['vendor-js','scripts','styles','html']);
gulp.task('build', gulpSequence('clean', 'run','copy-assets','optimize-images','notify'));

/*Default task - development mode*/
gulp.task('default', ['dev', 'server']);