'use strict';

/**
 * Requirements
 */
const CompileSassTask = require(SASS_SOURCE + '/task/CompileSassTask.js').CompileSassTask;
const SassPlugin = require(SASS_SOURCE + '/model/loader/documentation/SassPlugin.js').SassPlugin;
const SassConfiguration = require(SASS_SOURCE + '/configuration/SassConfiguration.js').SassConfiguration;
const CliLogger = require('entoj-system').cli.CliLogger;
const taskSpec = require('entoj-system/test').task.TaskShared;
const pathes = require('entoj-system').utils.pathes;
const projectFixture = require('entoj-system/test').fixture.project;
const co = require('co');
const VinylFile = require('vinyl');
const fs = require('fs-extra');
const normalize = pathes.normalizePathSeparators;


/**
 * Spec
 */
describe(CompileSassTask.className, function()
{
    /**
     * Task Test
     */
    taskSpec(CompileSassTask, 'task/CompileSassTask', prepareParameters);

    /**
     */
    function prepareParameters(parameters)
    {
        parameters.unshift({ includePathes: global.fixtures.pathToLibraries + '/sass' });
        parameters.unshift(new SassConfiguration(global.fixtures.globalConfiguration, global.fixtures.buildConfiguration));
        parameters.unshift(global.fixtures.pathesConfiguration);
        parameters.unshift(global.fixtures.entitiesRepository);
        parameters.unshift(global.fixtures.sitesRepository);
        parameters.unshift(global.fixtures.cliLogger);
        return parameters;
    }


    /**
     */
    const createTestee = function()
    {
        let parameters = Array.from(arguments);
        if (prepareParameters)
        {
            parameters = prepareParameters(parameters);
        }
        return new CompileSassTask(...parameters);
    };


    /**
     * SassTask Test
     */
    beforeEach(function()
    {
        global.fixtures = projectFixture.createDynamic();
        global.fixtures.entitiesRepository.loader.plugins.push(global.fixtures.context.di.create(SassPlugin));
        global.fixtures.cliLogger = new CliLogger();
        global.fixtures.cliLogger.muted = true;
        global.fixtures.path = pathes.concat(SASS_FIXTURES, '/temp');
        fs.emptyDirSync(global.fixtures.path);
    });


    describe('#generateFiles()', function()
    {
        xit('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.generateFiles();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        xit('should resolve to an array of vinyl files', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.generateFiles();
                expect(files).to.be.instanceof(Array);
                expect(files).to.have.length.above(0);
                expect(files[0]).to.be.instanceof(VinylFile);
            });
            return promise;
        });

        it('should generate a file for each group of each configured site', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.generateFiles();
                // Sites base & extended
                // Groups common & core
                expect(files).to.be.instanceof(Array);
                expect(files).to.have.length(4);
                expect(files.find(item => item.path == normalize('base/css/common.scss'))).to.be.ok;
                expect(files.find(item => item.path == normalize('base/css/core.scss'))).to.be.ok;
                expect(files.find(item => item.path == normalize('extended/css/common.scss'))).to.be.ok;
                expect(files.find(item => item.path == normalize('extended/css/core.scss'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to use a query to pick specific sites for generation', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.generateFiles(undefined, { query: 'base' });
                // Sites base
                // Groups common & core
                expect(files).to.be.instanceof(Array);
                expect(files).to.have.length(2);
                expect(files.find(item => item.path == normalize('base/css/common.scss'))).to.be.ok;
                expect(files.find(item => item.path == normalize('base/css/core.scss'))).to.be.ok;
            });
            return promise;
        });

        it('should generate files consisting of relative includes of all found sources', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.generateFiles();
                const source = files.find(item => item.path == normalize('base/css/core.scss'));
                expect(source.contents.toString()).to.contain('@import \'base/modules/m-teaser/sass/m-teaser.scss\';');
            });
            return promise;
        });

        it('should handle extended entities by including the extended source', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const files = yield testee.generateFiles();
                const source = files.find(item => item.path == normalize('extended/css/common.scss'));
                expect(source.contents.toString()).to.contain('@import \'base/elements/e-image/sass/e-image.scss\';');
                expect(source.contents.toString()).to.contain('@import \'extended/elements/e-image/sass/e-image.scss\';');
            });
            return promise;
        });

        it('should allow to specify the entities used for generation', function()
        {
            const promise = co(function *()
            {
                const entities =
                [
                    yield global.fixtures.entitiesRepository.getById('e-image'),
                    yield global.fixtures.entitiesRepository.getById('e-cta')
                ];
                const testee = createTestee();
                const files = yield testee.generateFiles(undefined, { entities: entities });

                expect(files).to.be.instanceof(Array);
                expect(files).to.have.length(2);

                const base = files.find(item => item.path == normalize('base/css/common.scss'));
                expect(base).to.be.ok;
                expect(base.contents.toString().split('\n')).to.have.length(4);
                expect(base.contents.toString()).to.contain('@import \'base/elements/e-cta/sass/e-cta.scss\';');
                expect(base.contents.toString()).to.contain('@import \'base/elements/e-image/sass/e-image.scss\';');

                const extended = files.find(item => item.path == normalize('extended/css/common.scss'));
                expect(extended).to.be.ok;
                expect(extended.contents.toString().split('\n')).to.have.length(5);
                expect(extended.contents.toString()).to.contain('@import \'base/elements/e-cta/sass/e-cta.scss\';');
                expect(extended.contents.toString()).to.contain('@import \'base/elements/e-image/sass/e-image.scss\';');
                expect(extended.contents.toString()).to.contain('@import \'extended/elements/e-image/sass/e-image.scss\';');

            });
            return promise;
        });
    });


    describe('#compileFile()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.compileFile();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should resolve to an vinyl files', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const sourceFile = new VinylFile(
                    {
                        path: 'test.scss',
                        contents: new Buffer('')
                    });
                const file = yield testee.compileFile(sourceFile);
                expect(file).to.be.instanceof(VinylFile);
            });
            return promise;
        });

        it('should compile the contents of the given file to css', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const sourceFile = new VinylFile(
                    {
                        path: 'test.scss',
                        contents: new Buffer('$spacer: 10px; .spacer { width: $spacer; }')
                    });
                const file = yield testee.compileFile(sourceFile);
                expect(file.contents.toString()).to.be.contain('width: 10px;');
            });
            return promise;
        });

        it('should change the file path to a .css extension', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const sourceFile = new VinylFile(
                    {
                        path: 'test.scss',
                        contents: new Buffer('')
                    });
                const file = yield testee.compileFile(sourceFile);
                expect(file.path).to.endWith('.css');
            });
            return promise;
        });

        it('should throw an error when compilation fails', function(cb)
        {
            co(function *()
            {
                const testee = createTestee();
                const sourceFile = new VinylFile(
                    {
                        path: 'test.scss',
                        contents: new Buffer('{% set model =  %}')
                    });
                yield testee.compileFile(sourceFile);
            }).catch((e) =>
            {
                expect(e).to.be.instanceof(Error);
                cb();
            });
        });
    });


    describe('#compileFiles()', function()
    {
        it('should return a stream', function(cb)
        {
            const testee = createTestee();
            testee.compileFiles()
                .on('finish', cb);
        });

        it('should stream a vinylfile for each group and site', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const data = yield taskSpec.readStream(testee.compileFiles());
                expect(data).to.have.length(4);
                for (const file of data)
                {
                    expect(file.contents.toString()).to.not.contain('@import \'');
                    expect(file.path).to.be.oneOf([normalize('base/css/common.css'), normalize('base/css/core.css'),
                        normalize('extended/css/common.css'), normalize('extended/css/core.css')]);
                }
            });
            return promise;
        });

        it('should allow to customize file pathes', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const data = yield taskSpec.readStream(testee.compileFiles(undefined, { bundleTemplate: '${site.name.urlify()}/${group}.scss' }));
                expect(data).to.have.length(4);
                for (const file of data)
                {
                    expect(file.contents.toString()).to.not.contain('@import \'');
                    expect(file.path).to.be.oneOf([normalize('base/common.css'), normalize('base/core.css'),
                        normalize('extended/common.css'), normalize('extended/core.css')]);
                }
            });
            return promise;
        });
    });


    describe('#stream()', function()
    {
        it('should stream all compiled css files', function()
        {
            const promise = co(function *()
            {
                const testee = createTestee();
                const data = yield taskSpec.readStream(testee.stream());
                expect(data).to.have.length(4);
                for (const file of data)
                {
                    expect(file.path).to.be.oneOf([normalize('base/css/common.css'), normalize('base/css/core.css'),
                        normalize('extended/css/common.css'), normalize('extended/css/core.css')]);
                }
            });
            return promise;
        });
    });
});
