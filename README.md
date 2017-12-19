
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]

# entoj-sass integration

## Features

### Commands

#### SassCommand

Provides cli integration for sass compiling

##### Configuration

```js
configuration.commands.push(
	{
        type: require('entoj-sass').command.SassCommand
    }
);
```


### Linter

#### SassFileLinter

Provides support for sass file linting for the LintCommand

##### Configuration

```js
configuration.commands.push(
    {
        type: require('entoj-system').command.LintCommand,
        '!linters':
        [
            {
                type: require('entoj-sass').linter.SassFileLinter,
                options:
                {
                    useDefaultRules: true
                }
            }
        ]
    }
);
```



## Configuration

### sass.includePathes

**Default:** `[]`
**Type:** `Array`
**Global:** Yes
**Environment:** Yes

Pathes for sass files that are available to @include

---

### sass.bundlePath

**Default:** `${cache}/sass/bundles`
**Type:** `String`
**Global:** Yes
**Environment:** Yes

Path for compiled css bundles

---

### sass.bundleTemplate

**Default:** `${site.name.urlify()}/css/${group}.scss`
**Type:** `String`
**Global:** Yes
**Environment:** Yes

Template for generating css bundle filenames

---

### sass.browsers

**Default:** `['ie >= 9', '> 2%']`
**Type:** `Array<String>`
**Global:** No
**Environment:** Yes

Sets the minimal supported Browsers versions. See [http://cssnext.io/usage/#browsers](http://cssnext.io/usage/#browsers)

---

### sass.sourceMaps

**Default:** `false`
**Type:** `Boolean`
**Global:** No
**Environment:** Yes

Embeds source maps into compiled bundles

---

### sass.optimize

**Default:** `false`
**Type:** `Boolean`
**Global:** No
**Environment:** Yes

Enables destructive css optimizations - use with care

---

### sass.minify

**Default:** `false`
**Type:** `Boolean`
**Global:** No
**Environment:** Yes

Enables css minifications

---

### sass.urlRewrite

**Default:** `false`
**Type:** `Array<String>`
**Global:** No
**Environment:** Yes

Allows to rewrite urls to make them fit the target environment. See [https://github.com/iAdramelk/postcss-urlrewrite](https://github.com/iAdramelk/postcss-urlrewrite)


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

---

### Licence
[Apache License 2.0](LICENCE)

[travis-image]: https://img.shields.io/travis/entoj/entoj-sass/master.svg?label=linux
[travis-url]: https://travis-ci.org/entoj/entoj-sass
[appveyor-image]: https://img.shields.io/appveyor/ci/ChristianAuth/entoj-sass/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/ChristianAuth/entoj-sass
[coveralls-image]: https://img.shields.io/coveralls/entoj/entoj-sass/master.svg
[coveralls-url]: https://coveralls.io/r/entoj/entoj-sass?branch=master
