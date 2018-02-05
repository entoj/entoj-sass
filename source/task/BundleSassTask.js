'use strict';

/**
 * Requirements
 * @ignore
 */
const WrappingTask = require('entoj-system').task.WrappingTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const EntitiesRepository = require('entoj-system').model.entity.EntitiesRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const SassConfiguration = require('../configuration/SassConfiguration.js').SassConfiguration;
const CompileSassTask = require('./CompileSassTask.js').CompileSassTask;
const PostProcessSassTask = require('./PostProcessSassTask.js').PostProcessSassTask;
const DecorateTask = require('entoj-system').task.DecorateTask;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const gitRev = require('git-rev-promises');
const co = require('co');


/**
 * @memberOf task
 * @extends task.WrappingTask
 */
class BundleSassTask extends WrappingTask
{
    /**
     * @param {cli.CliLogger} cliLogger
     * @param {model.site.SitesRepository} sitesRepository
     * @param {model.entity.EntitiesRepository} entitiesRepository
     * @param {model.configuration.PathesConfiguration} pathesConfiguration
     * @param {configuration.SassConfiguration} sassConfiguration
     */
    constructor(cliLogger, sitesRepository, entitiesRepository, pathesConfiguration, sassConfiguration)
    {
        super(cliLogger);

        //Check params
        assertParameter(this, 'sitesRepository', sitesRepository, true, SitesRepository);
        assertParameter(this, 'entitiesRepository', entitiesRepository, true, EntitiesRepository);
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'sassConfiguration', sassConfiguration, true, SassConfiguration);

        // Assign options
        this._sitesRepository = sitesRepository;
        this._entitiesRepository = entitiesRepository;
        this._pathesConfiguration = pathesConfiguration;
        this._sassConfiguration = sassConfiguration;
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, SitesRepository, EntitiesRepository,
            PathesConfiguration, SassConfiguration] };
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'task/BundleSassTask';
    }


    /**
     * @returns {String}
     */
    get sectionName()
    {
        return 'Bundling SASS into CSS files';
    }


    /**
     * @type model.configuration.PathesConfiguration
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @type model.site.SitesRepository
     */
    get sitesRepository()
    {
        return this._sitesRepository;
    }


    /**
     * @type model.entity.EntitiesRepository
     */
    get entitiesRepository()
    {
        return this._entitiesRepository;
    }


    /**
     * @type model.entity.EntitiesRepository
     */
    get sassConfiguration()
    {
        return this._sassConfiguration;
    }


    /**
     * @protected
     * @param {model.configuration.BuildConfiguration} buildConfiguration
     * @param {Object} parameters
     * @returns {Promise}
     */
    runTasks(buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            let prepend = false;
            if (buildConfiguration.get('sass.banner', false))
            {
                prepend = '/** ' + buildConfiguration.get('sass.banner', false) + ' **/';
            }
            const options =
            {
                query: parameters.query,
                decoratePrepend: prepend,
                decorateVariables:
                {
                    date: new Date(),
                    gitHash: yield gitRev.long(),
                    gitBranch: yield gitRev.branch()
                }
            };
            const result = yield new CompileSassTask(scope.cliLogger, scope.sitesRepository, scope.entitiesRepository, scope.pathesConfiguration, scope.sassConfiguration)
                .pipe(new PostProcessSassTask(scope.cliLogger))
                .pipe(new DecorateTask(scope.cliLogger))
                .run(buildConfiguration, options);
            return result;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.BundleSassTask = BundleSassTask;
