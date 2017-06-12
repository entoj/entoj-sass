'use strict';

/**
 * Requirements
 * @ignore
 */
const TransformingTask = require('entoj-system').task.TransformingTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const VinylFile = require('vinyl');
const co = require('co');
const postcss = require('postcss');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const cssnext = require('postcss-cssnext');
const urlrewrite = require('postcss-urlrewrite');
const doiuse = require('doiuse');


/**
 * @memberOf task
 * @extends task.SimpleTask
 */
class PostProcessSassTask extends TransformingTask
{
    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'sass.task/PostProcessSassTask';
    }


    /**
     * @returns {String}
     */
    get sectionName()
    {
        return 'Applying PostCSS';
    }


    /**
     * @inheritDocs
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const promise = super.prepareParameters(buildConfiguration, parameters)
            .then((params) =>
            {
                params.browsers = ['ie >= 9', '> 2%'];
                params.sourceMaps = false;
                params.optimize = false;
                params.minimize = false;
                params.check = false;
                params.urlRewrite = false;
                if (buildConfiguration)
                {
                    params.browsers = buildConfiguration.get('sass.browsers', params.browsers);
                    params.sourceMaps = buildConfiguration.get('sass.sourceMaps', params.sourceMaps);
                    params.optimize = buildConfiguration.get('sass.optimize', params.optimize);
                    params.minimize = buildConfiguration.get('sass.minimize', params.minimize);
                    params.check = buildConfiguration.get('sass.check', params.check);
                    params.urlRewrite = buildConfiguration.get('sass.urlRewrite', params.urlRewrite);
                }
                return params;
            });
        return promise;
    }


    /**
     * @returns {Stream}
     */
    processFile(file, buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function*()
        {
            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);

            /* istanbul ignore next */
            if (!file || !file.isNull)
            {
                scope._cliLogger.info('Invalid file <' + file + '>');
                return false;
            }

            // Start
            const work = scope._cliLogger.work('Processing file <' + file.path + '>');

            // Add needed plugins
            const plugins = [];
            if (params.urlRewrite !== false)
            {
                plugins.push(urlrewrite(
                    {
                        properties: ['background', 'src', 'background-image'],
                        rules: params.urlRewrite
                    }));
            }
            if (params.check === true)
            {
                plugins.push(doiuse(
                    {
                        browsers: params.browsers,
                        onFeatureUsage: function(usageInfo)
                        {
                            scope.cliLogger.error(usageInfo.message);
                        }
                    }));
            }
            plugins.push(cssnext(
                {
                    browsers: params.browsers,
                    warnForDuplicates: false
                }));
            if (params.optimize === true)
            {
                plugins.push(mqpacker());
            }
            if (params.minimize === true)
            {
                plugins.push(cssnano());
            }

            // Apply postcss plugins
            const options =
            {
                from: file.path,
                to: file.path,
                map: params.sourceMaps
            };
            let resultFile;
            try
            {
                const result = yield postcss(plugins)
                    .process(file.contents.toString(), options);
                resultFile = new VinylFile(
                    {
                        path: file.path,
                        contents: new Buffer(result.css)
                    });
                resultFile.postcssPlugins = result.processor.plugins;
            }
            catch(e)
            {
                /* istanbul ignore next */
                scope._cliLogger.error(e);
            }

            // Done
            scope._cliLogger.end(work);
            return resultFile;
        });
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.PostProcessSassTask = PostProcessSassTask;
