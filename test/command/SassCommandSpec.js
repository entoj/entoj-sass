'use strict';

/**
 * Requirements
 */
const SassCommand = require(SASS_SOURCE + '/command/SassCommand.js').SassCommand;
const commandSpec = require('entoj-system/test').command.CommandShared;
const testFixture = require('entoj-system/test').fixture.test;
const projectFixture = require('entoj-system/test').fixture.project;
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');


/**
 * Spec
 */
describe(SassCommand.className, function()
{
    /**
     * Command Test
     */
    commandSpec(SassCommand, 'command/SassCommand', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require(SASS_SOURCE + '/model/loader/documentation/SassPlugin.js').SassPlugin);
            config.pathes.entojTemplate = SASS_FIXTURES;
            config.pathes.cacheTemplate = SASS_FIXTURES + '/temp';
            config.settings.sass =
            {
                includePathes: [testFixture.pathToLibraries + '/sass']
            };
            return config;
        });
        return [global.fixtures.context];
    }


    /**
     * SassCommand Test
     */
    function createTestee(buildConfiguration)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.entities.loader.plugins.push(require(SASS_SOURCE + '/model/loader/documentation/SassPlugin.js').SassPlugin);
            config.pathes.entojTemplate = SASS_FIXTURES;
            config.pathes.cacheTemplate = SASS_FIXTURES + '/temp';
            config.settings.sass =
            {
                includePathes: [testFixture.pathToLibraries + '/sass']
            };
            config.environments.development = buildConfiguration || {};
            config.logger.muted = true;
            return config;
        });
        return new SassCommand(global.fixtures.context);
    }


    describe('#bundle()', function()
    {
        it('should return a promise', function()
        {
            const testee = createTestee();
            const promise = testee.bundle();
            expect(promise).to.be.instanceof(Promise);
            return promise;
        });

        it('should create all configured css bundles', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SASS_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.bundle();
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/common.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/core.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/extended/css/common.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/extended/css/core.css'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to pass a query for entities', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SASS_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.bundle({ _:['base'] });
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/common.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/core.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/extended/css/common.css'))).to.be.not.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/sass/bundles/extended/css/core.css'))).to.be.not.ok;
            });
            return promise;
        });

        it('should allow to write bundles to a custom path', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SASS_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.bundle({ _:['base'], destination: path.join(SASS_FIXTURES, '/temp/release') });
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/release/base/css/common.css'))).to.be.ok;
                expect(yield fs.exists(path.join(SASS_FIXTURES, '/temp/release/base/css/core.css'))).to.be.ok;
            });
            return promise;
        });

        it('should allow to add a configurable banner via environment settings', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SASS_FIXTURES, '/temp'));
                const testee = createTestee({ sass: { banner: 'Banner!' }});
                yield testee.bundle();
                const filename = path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/common.css');
                expect(yield fs.readFile(filename, { encoding: 'utf8' })).to.contain('/** Banner!');
            });
            return promise;
        });

        it('should allow to post process files via environment settings', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SASS_FIXTURES, '/temp'));
                const testee = createTestee({ sass: { minify: true }});
                yield testee.bundle();
                const filename = path.join(SASS_FIXTURES, '/temp/sass/bundles/base/css/common.css');
                expect(yield fs.readFile(filename, { encoding: 'utf8' })).to.not.contain('/**');
            });
            return promise;
        });
    });
});
