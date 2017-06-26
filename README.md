
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]

# entoj sass integration

## Running tests

Runs all test specs at once
```
npm test
```

Runs all test matching the given regex
```
npm test -- --grep model/
```

Enables logging while running tests
```
npm test -- --vvvv
```

Runs all test specs and shows test coverage
```
npm run coverage
```

Lints all source files
```
npm run lint
```

# Configuration

## Global configuration

sass.compilePath: ${cache}/sass/compile


## Environment configuration

sass.browsers: ['ie >= 9', '> 2%']
sass.sourceMaps; false
sass.optimize: false
sass.minify: false
sass.check: false
sass.urlRewrite: false

---

### Licence
[Apache License 2.0](LICENCE)

[travis-image]: https://img.shields.io/travis/entoj/entoj-sass/master.svg?label=linux
[travis-url]: https://travis-ci.org/entoj/entoj-sass
[appveyor-image]: https://img.shields.io/appveyor/ci/ChristianAuth/entoj-sass/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/ChristianAuth/entoj-sass
[coveralls-image]: https://img.shields.io/coveralls/entoj/entoj-sass/master.svg
[coveralls-url]: https://coveralls.io/r/entoj/entoj-sass?branch=master
