'use strict';

/**
 * Requirements
 * @ignore
 */
const Task = require('entoj-system').task.Task;
const SassConfiguration = require('../configuration/SassConfiguration.js').SassConfiguration;
const EntitiesRepository = require('entoj-system').model.entity.EntitiesRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const ContentType = require('entoj-system').model.ContentType;
const CliLogger = require('entoj-system').cli.CliLogger;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const assertParameter = require('entoj-system').utils.assert.assertParameter;
const pathes = require('entoj-system').utils.pathes;
const urls = require('entoj-system').utils.urls;
const through2 = require('through2');
const VinylFile = require('vinyl');
const co = require('co');
const sass = require('node-sass');
const templateString = require('es6-template-strings');


/**
 * @memberOf task
 */
class CompileSassTask extends Task
{
    /**
     * @param {cli.CliLogger} cliLogger
     * @param {model.site.SitesRepository} sitesRepository
     * @param {model.entity.EntitiesRepository} entitiesRepository
     * @param {model.configuration.PathesConfiguration} pathesConfiguration
     * @param {configuration.SassConfiguration} sassConfiguration
     */
    constructor(cliLogger, sitesRepository, entitiesRepository, pathesConfiguration, sassConfiguration, options)
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
        this._options = options || {};
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, SitesRepository, EntitiesRepository,
            PathesConfiguration, SassConfiguration, 'task/CompileSassTask.options'] };
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'task/CompileSassTask';
    }


    /**
     * @type configuration.SassConfiguration
     */
    get sassConfiguration()
    {
        return this._sassConfiguration;
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
     * @type {Object}
     */
    get options()
    {
        return this._options;
    }


    /**
     * @inheritDoc
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const parent = super.prepareParameters(buildConfiguration, parameters);
        const scope = this;
        const promise = co(function*()
        {
            const params = yield parent;
            params.query = params.query || '*';
            if (!params.bundleTemplate)
            {
                params.bundleTemplate = scope.sassConfiguration.bundleTemplate;
            }
            if (params.includePathes)
            {
                params.includePathes = Array.isArray(params.includePathes)
                    ? params.includePathes
                    : [params.includePathes];
            }
            else
            {
                params.includePathes = [];
                for (const path of scope.sassConfiguration.includePathes)
                {
                    const resolved = yield scope.pathesConfiguration.resolve(path);
                    params.includePathes.push(resolved);
                }
            }
            return params;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    generateFilesForEntities(site, entities, buildConfiguration, params)
    {
        // Prepare
        const files = [];

        // Get settings file - this is prepended to all generated files
        let settingsFile = site.properties.getByPath('sass.settings', false);
        if (!settingsFile && site.extends)
        {
            settingsFile = site.extends.properties.getByPath('sass.settings', false);
        }
        const excludeFiles = [settingsFile];
        if (site.extends && site.extends.properties.getByPath('sass.settings', false))
        {            
            excludeFiles.push(site.extends.properties.getByPath('sass.settings', false));
        }

        // Get all sites
        const sites = [];
        let currentSite = site;
        while(currentSite)
        {
            sites.unshift(currentSite);
            currentSite = currentSite.extends;
        }

        // Make sure that lower categories are rendered first
        entities.sort((a, b) => a.id.category.position - b.id.category.position);        

        // Get scss files for each entity and site
        const sourceFiles = {};
        for (const entity of entities)
        {
            const group = entity.properties.getByPath('groups.css', this.sassConfiguration.defaultGroup);
            sourceFiles[group] = sourceFiles[group] || [];
            for (const s of sites)
            {
                const files = entity.files.filter((file) =>
                {
                    const add = file.contentType === ContentType.SASS &&
                        !file.basename.startsWith('_') &&
                        file.site.isEqualTo(s);
                    return add;
                });
                if (files)
                {
                    sourceFiles[group].push(...files);
                }
            }            
        }

        // Create sass files
        for (const group in sourceFiles)
        {
            const filename = templateString(params.bundleTemplate,
                {
                    site: site,
                    group: group
                });
            const workGroup = this.cliLogger.work('Generating <' + filename + '> for site <' + site.name + '> and group <' + group + '>');

            let content = '';
            if (settingsFile)
            {
                content+= `@import '${settingsFile}';\n`;
            }
            for (const file of sourceFiles[group])
            {
                let includePath = pathes.normalize(file.filename);
                includePath = includePath.replace(pathes.normalize(this.pathesConfiguration.sites), '');
                includePath = urls.normalizePathSeparators(pathes.trimLeadingSlash(includePath));
                if (excludeFiles.indexOf(includePath) === -1)
                {
                    content+= `@import '${includePath}';\n`;
                }
            }
            const vinylFile = new VinylFile(
                {
                    path: filename,
                    contents: new Buffer(content)
                });
            files.push(vinylFile);
            this.cliLogger.end(workGroup);
        }
        return Promise.resolve(files);
    }


    /**
     * @protected
     * @returns {Promise<Array>}
     */
    generateFiles(buildConfiguration, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);

            // Start
            const work = scope.cliLogger.section('Generating sass files for <' + params.query + '>');

            // Get Sites
            let sites = [];
            if (params.query !== '*')
            {
                const site = yield scope.sitesRepository.findBy({ '*': params.query });
                sites.push(site);
            }
            else
            {
                sites = yield scope.sitesRepository.getItems();
            }
            scope.logger.debug('Generating files for sites : ' + (sites.reduce((current, next) => current+= next.name + ' ', '')));

            // Get files
            const files = [];
            for (const site of sites)
            {
                let entities = [];
                if (params.entities)
                {
                    for (const entity of params.entities)
                    {
                        if (entity.usedBy.indexOf(site) > -1 || entity.site.isEqualTo(site))
                        {
                            entities.push(entity);
                        }
                    }
                }
                else
                {
                    entities = yield scope.entitiesRepository.getBySite(site);
                }
                const siteFiles = yield scope.generateFilesForEntities(site, entities, buildConfiguration, params);
                files.push(...siteFiles);
            }

            // End
            scope.cliLogger.end(work);
            return files;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * Compiles a sass file
     *
     * @protected
     * @return {Promise<VinylFile>}
     */
    compileFile(file, buildConfiguration, parameters)
    {
        if (!file || !file.isNull)
        {
            return Promise.resolve('');
        }

        const scope = this;
        const promise = co(function *()
        {
            const work = scope.cliLogger.work('Compiling file <' + file.path + '>');

            // Prepare
            const params = yield scope.prepareParameters(buildConfiguration, parameters);
            const includePathes = [scope._pathesConfiguration.sites];
            includePathes.push(...params.includePathes);
            if (scope.options.includePathes)
            {
                includePathes.push(scope.options.includePathes);
            }

            const compiledFile = new VinylFile(
                {
                    path: file.path ? file.path.replace(/\.scss/, '.css') : '',
                    contents: false
                });
            const options =
            {
                data: file.contents.toString(),
                includePaths: includePathes,
                outputStyle: 'expanded',
                sourceMap: buildConfiguration
                    ? buildConfiguration.get('sass.sourceMaps', false)
                    : false,
                sourceMapEmbed: true
            };

            // Render
            let compiled = false;
            try
            {
                if (options.data != '')
                {
                    compiled = sass.renderSync(options);
                }
                else
                {
                    compiled = { css: '' };
                }
            }
            catch(error)
            {
                compiled = false;
                scope.logger.error('Error compiling Sass');
                scope.logger.error(error.message);
                scope.logger.error(error.file + '@' + error.line);
            }

            // Error?
            if (compiled === false)
            {
                scope.cliLogger.end(work, true);
                throw new Error(scope.className + '::compileFile - could not compile file ' + file.path);
            }

            // Done
            compiledFile.contents = new Buffer(compiled.css);
            scope.cliLogger.end(work);
            return compiledFile;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @protected
     * @returns {Stream}
     */
    compileFiles(buildConfiguration, parameters)
    {
        const stream = through2(
            {
                objectMode: true
            });
        const scope = this;
        co(function *()
        {
            const sourceFiles = yield scope.generateFiles(buildConfiguration, parameters);
            const work = scope.cliLogger.section('Compiling sass files');
            const params = yield scope.prepareParameters(buildConfiguration, parameters);
            scope.cliLogger.options(params);
            for (const sourceFile of sourceFiles)
            {
                const compiledFile = yield scope.compileFile(sourceFile, buildConfiguration, parameters);
                stream.write(compiledFile);
            }
            stream.end();
            scope.cliLogger.end(work);
        }).catch(ErrorHandler.handler(scope));
        return stream;
    }


    /**
     * @returns {Stream}
     */
    stream(stream, buildConfiguration, parameters)
    {
        let resultStream = stream;
        if (!resultStream)
        {
            resultStream = this.compileFiles(buildConfiguration, parameters);
        }
        return resultStream;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.CompileSassTask = CompileSassTask;
