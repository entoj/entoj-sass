'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
const SassConfiguration = require('../configuration/SassConfiguration.js').SassConfiguration;
const CompileSassTask = require('../task/CompileSassTask.js').CompileSassTask;
const PostProcessSassTask = require('../task/PostProcessSassTask.js').PostProcessSassTask;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const DecorateTask = require('entoj-system').task.DecorateTask;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const ModelSynchronizer = require('entoj-system').watch.ModelSynchronizer;
const CliLogger = require('entoj-system').cli.CliLogger;
const Context = require('entoj-system').application.Context;
const co = require('co');
const gitRev = require('git-rev-promises');


/**
 * Allows to compile or watch sass files
 *
 * @class
 * @extends command.Command
 * @memberOf command
 */
class SassCommand extends Command
{
    /**
     * @param {application.Context} context
     */
    constructor(context)
    {
        super(context);

        // Assign options
        this._name = ['sass'];
    }


    /**
     * @ignore
     */
    static get injections()
    {
        return { 'parameters': [Context] };
    }


    /**
     * @ignore
     */
    static get className()
    {
        return 'command/SassCommand';
    }


    /**
     * @ignore
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Compiles scss files into bundles',
            actions:
            [
                {
                    name: 'bundle',
                    description: 'Compiles all scss files',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'inline',
                            optional: true,
                            defaultValue: '*',
                            description: 'Query for sites to use e.g. /base'
                        },
                        {
                            name: 'destination',
                            type: 'named',
                            value: 'path',
                            optional: true,
                            defaultValue: '',
                            description: 'Define a base folder where css files are written to'
                        }
                    ]
                },
                {
                    name: 'watch',
                    description: 'Watches for changes and compiles scss files when necessary'
                }
            ]
        };
        return help;
    }


    /**
     * Compiles sass files into configured bundles
     *
     * @protected
     * @param {Object} parameters
     * @returns {Promise}
     */
    bundle(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.sass.compile');
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const sassConfiguration = scope.context.di.create(SassConfiguration);
            let prepend = false;
            if (buildConfiguration.get('sass.banner', false))
            {
                prepend = '/** ' + buildConfiguration.get('sass.banner', false) + ' **/';
            }
            const options =
            {
                query: parameters && parameters._ && parameters._[0] || '*',
                writePath: yield pathesConfiguration.resolve((parameters && parameters.destination) || sassConfiguration.bundlePath),
                decoratePrepend: prepend,
                decorateVariables:
                {
                    date: new Date(),
                    gitHash: yield gitRev.long(),
                    gitBranch: yield gitRev.branch()
                }
            };
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            yield scope.context.di.create(CompileSassTask, mapping)
                .pipe(scope.context.di.create(PostProcessSassTask, mapping))
                .pipe(scope.context.di.create(DecorateTask, mapping))
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, options);
        });
        return promise;
    }


    /**
     * Uses watch.ModelSynchronizer to wait for changes on .sass files
     * to compile them
     *
     * @protected
     * @param {Object} parameters
     * @returns {Promise}
     */
    watch(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.sass.watch');
            const modelSynchronizer = scope.context.di.create(ModelSynchronizer);
            yield scope.bundle(parameters);
            yield modelSynchronizer.start();
            modelSynchronizer.signals.invalidated.add((synchronizer, invalidations) =>
            {
                if (invalidations.extensions.indexOf('.scss') > -1)
                {
                    logger.info('Detected change in <Sass Files>');
                    scope.compile(parameters);
                }
            });
        });
        return promise;
    }


    /**
     * @ignore
     */
    dispatch(action, parameters)
    {
        if (action === 'watch')
        {
            return this.watch(parameters);
        }
        return this.bundle(parameters);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassCommand = SassCommand;
