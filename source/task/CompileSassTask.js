'use strict';

/**
 * Requirements
 * @ignore
 */
const Task = require('entoj-system').task.Task;
const SassConfiguration = require('../configuration/SassConfiguration.js').SassConfiguration;
const FilesRepository = require('entoj-system').model.file.FilesRepository;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const ContentType = require('entoj-system').model.ContentType;
const Site = require('entoj-system').model.site.Site;
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
     *
     */
    constructor(cliLogger, filesRepository, sitesRepository, pathesConfiguration, sassConfiguration, options)
    {
        super(cliLogger);

        //Check params
        assertParameter(this, 'filesRepository', filesRepository, true, FilesRepository);
        assertParameter(this, 'sitesRepository', sitesRepository, true, SitesRepository);
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'sassConfiguration', sassConfiguration, true, SassConfiguration);

        // Assign options
        this._filesRepository = filesRepository;
        this._sitesRepository = sitesRepository;
        this._pathesConfiguration = pathesConfiguration;
        this._sassConfiguration = sassConfiguration;
        this._options = options || {};
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, FilesRepository, SitesRepository,
            PathesConfiguration, SassConfiguration, 'task/CompileSassTask.options'] };
    }


    /**
     * @inheritDocs
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
     * @type model.file.FilesRepository
     */
    get filesRepository()
    {
        return this._filesRepository;
    }


    /**
     * @type {Object}
     */
    get options()
    {
        return this._options;
    }


    /**
     * @inheritDocs
     */
    prepareParameters(buildConfiguration, parameters)
    {
        const parent = super.prepareParameters(buildConfiguration, parameters);
        const scope = this;
        const promise = co(function*()
        {
            const params = yield parent;
            params.query = params.query || '*';
            params.filenameTemplate = params.filenameTemplate || '${site.name.urlify()}/css/${group}.scss';
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
                // Get settings file - this is prepended to all generated files
                let settingsFile = site.properties.getByPath('sass.settings', false);
                if (!settingsFile && site.extends)
                {
                    settingsFile = site.extends.properties.getByPath('sass.settings', false);
                }

                // Get sass sources
                const filter = function(file)
                {
                    return file.contentType === ContentType.SASS && !file.basename.startsWith('_');
                };
                const sourceFiles = yield scope.filesRepository.getBySiteGrouped(site, filter, 'groups.css', 'common');

                // Create sass files
                for (const group in sourceFiles)
                {
                    const filename = templateString(params.filenameTemplate, { site: site, group: group });
                    const workGroup = scope.cliLogger.work('Generating <' + filename + '> for site <' + site.name + '> and group <' + group + '>');

                    let content = '';
                    if (settingsFile)
                    {
                        content+= `@import '${settingsFile}';\n`;
                    }
                    for (const file of sourceFiles[group])
                    {
                        let includePath = pathes.normalize(file.filename);
                        includePath = includePath.replace(pathes.normalize(scope.pathesConfiguration.sites), '');
                        includePath = urls.normalizePathSeparators(pathes.trimLeadingSlash(includePath));
                        if (includePath !== settingsFile)
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
                    scope.cliLogger.end(workGroup);
                }
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
