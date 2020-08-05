var gulp = require('gulp')
var plugins = require('gulp-load-plugins')()

var source = 'src'
var dest = 'dist'

var targets = {
  ie: '9',
  firefox: '17'
}

var coffeeOptions = {
  require: true,
  bare: true,
  sourcemaps: true,
  inlineMap: false
}

var coffeeSource = [
  source + '/js/__header.coffee',
  source + '/js/__modules.coffee',
  source + '/js/parts/**/*.coffee',
  source + '/js/init.coffee'
]

var coffee = function () {
  return gulp.src(coffeeSource)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('init.coffee'))
    .pipe(plugins.coffee(coffeeOptions))
    .pipe(plugins.babel({ presets: [['env', { targets: targets }]], plugins: ['@babel/plugin-transform-classes'] }))
    .pipe(plugins.rename('wheelzoom.js'))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
}

var minifyCoffee = function () {
  return gulp.src(coffeeSource)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('init.coffee'))
    .pipe(plugins.coffee(coffeeOptions))
    .pipe(plugins.babel({ presets: [['env', { targets: targets }]], plugins: ['@babel/plugin-transform-classes'] }))
    .pipe(plugins.minify({
      ext: {
        min: '.min.js'
      }
    }))
    .pipe(plugins.rename('wheelzoom.min.js'))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
}

gulp.task('lint', function () {
  return gulp.src(coffeeSource)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.failOnError())
})

var css = function () {
  return gulp.src(source + '/sass/*.scss')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
}

var minifyCss = function () {
  return gulp.src(source + '/sass/*.scss')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass())
    .pipe(plugins.cleanCss({ compatibility: 'ie9' }))
    .pipe(plugins.rename('wheelzoom.min.css'))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
}

// SPECIFIC TASKS
gulp.task('style', gulp.parallel(css, minifyCss))
gulp.task('script', gulp.parallel(coffee, minifyCoffee))

// GENERAL TASKS
gulp.task('clean', function () {
  return gulp.src('dist/*', { read: false }).pipe(plugins.clean())
})
gulp.task('build', gulp.series('clean', 'style', 'script'))
gulp.task('watch', gulp.series('clean', function multipleWatch () {
  gulp.watch('src/sass/**/*', { ignoreInitial: false }, gulp.series('style'))
  gulp.watch('src/js/**/*', { ignoreInitial: false }, gulp.series('script'))
}))
gulp.task('test', gulp.series('lint'))
