'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
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
     */
    constructor(context)
    {
        super(context);

        // Assign options
        this._name = ['sass'];
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/SassCommand';
    }


    /**
     * @inheritDocs
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Compiles and optimizes css files',
            actions:
            [
                {
                    name: 'compile [query]',
                    description: 'Compiles all scss files',
                    options:
                    [
                        {
                            name: 'query',
                            type: 'optional',
                            defaultValue: '*',
                            description: 'Compiles scss for the given site'
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
     * @inheritDocs
     * @returns {Promise}
     */
    compile(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.sass.compile');
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const path = yield pathesConfiguration.resolveCache('/css');
            const options =
            {
                query: parameters && parameters._[0] || '*',
                writePath: path,
                decoratePrepend: '/** generated ' + (new Date()) + ' **/\n'
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
     * @inheritDocs
     * @returns {Promise}
     */
    watch(parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            const logger = scope.createLogger('command.sass.watch');
            const modelSynchronizer = scope.context.di.create(ModelSynchronizer);
            yield scope.compile(parameters);
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
     * @inheritDocs
     * @returns {Promise<Server>}
     */
    dispatch(action, parameters)
    {
        if (action === 'watch')
        {
            return this.watch(parameters);
        }
        return this.compile(parameters);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassCommand = SassCommand;
