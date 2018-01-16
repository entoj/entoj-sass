'use strict';

/**
 * Requirements
 */
const PostProcessSassTask = require(SASS_SOURCE + '/task/PostProcessSassTask.js').PostProcessSassTask;
const CliLogger = require('entoj-system/').cli.CliLogger;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const taskSpec = require('entoj-system/test').task.TaskShared;
const through2 = require('through2');
const VinylFile = require('vinyl');
const co = require('co');


/**
 * Spec
 */
describe(PostProcessSassTask.className, function()
{
    /**
     * Task Test
     */
    taskSpec(PostProcessSassTask, 'task/PostProcessSassTask', function(parameters)
    {
        const cliLogger = new CliLogger();
        cliLogger.muted = true;
        return [cliLogger];
    });


    /**
     * PostProcessSassTask Test
     */
    beforeEach(function()
    {
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
        global.fixtures.buildConfiguration = new BuildConfiguration();
        const sourceStream = through2(
            {
                objectMode: true
            });
        sourceStream.write(new VinylFile(
            {
                path: 'test.css',
                contents: new Buffer('/* test */')
            }));
        sourceStream.end();
        global.fixtures.sourceStream = sourceStream;
    });


    // Reduces a postcss plugin list to a simple array of names
    function preparePluginList(list)
    {
        const result = [];
        for (let index = 0; index < list.length; index++)
        {
            if (list[index].postcssPlugin)
            {
                result.push(list[index].postcssPlugin);
            }
            else
            {
                const source = list[index].toString();
                if (source.indexOf('only partially supported by') > -1)
                {
                    result.push('doiuse');
                }
                else if (source.indexOf('if ( config.imports    ) { style.walkAtRules( updateImport ); }') > -1)
                {
                    result.push('urlrewrite');
                }
            }
        }
        return result;
    }


    // Creates a sass build configuration
    function prepareBuildSettings(options)
    {
        const opts =
        {
            environments:
            {
                development:
                {
                    sass: options
                }
            }
        };
        return new BuildConfiguration(opts);
    }


    // Tests if the given plugins where used on all files
    function testPostCSSPlugins(options, plugins)
    {
        const promise = co(function *()
        {
            const testee = new PostProcessSassTask(global.fixtures.cliLogger);
            const data = yield taskSpec.readStream(testee.stream(global.fixtures.sourceStream, prepareBuildSettings(options)));
            for (const file of data)
            {
                const postcssPlugins = preparePluginList(file.postcssPlugins);
                for (const plugin of plugins)
                {
                    expect(postcssPlugins).to.contain(plugin);
                }
            }
        });
        return promise;
    }


    describe('#stream()', function()
    {
        it('should apply cssnext to all files', function()
        {
            return testPostCSSPlugins({}, ['autoprefixer', 'postcss-selector-not']);
        });

        it('should apply doiuse to all files when build configuration check == true', function()
        {
            return testPostCSSPlugins({ check: true }, ['doiuse']);
        });

        it('should apply rtl to all files when build configuration rtl == true', function()
        {
            return testPostCSSPlugins({ rtl: true }, ['postcss-rtl']);
        });

        it('should apply urlRewrite to all files when build configuration urlRewrite != false', function()
        {
            return testPostCSSPlugins({ urlRewrite: [{ from: /\/base\//, to: '../' }] }, ['urlrewrite']);
        });

        it('should apply mqpacker to all files when build configuration optimize == true', function()
        {
            return testPostCSSPlugins({ optimize: true }, ['css-mqpacker']);
        });

        it('should apply cssnano to all files when build configuration minimize == true', function()
        {
            return testPostCSSPlugins({ minify: true }, ['cssnano-core']);
        });

        it('should inline source maps in all files when build configuration sourceMaps == true', function()
        {
            const promise = co(function *()
            {
                const testee = new PostProcessSassTask(global.fixtures.cliLogger);
                const data = yield taskSpec.readStream(testee.stream(global.fixtures.sourceStream, prepareBuildSettings({ sourceMaps: true })));
                for (const file of data)
                {
                    expect(file.contents.toString()).to.contain('/*# sourceMappingURL=');
                }
            });
            return promise;
        });
    });
});
