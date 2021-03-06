/**
 * Requirements
 */
const SassPlugin = require(SASS_SOURCE + '/model/loader/documentation/SassPlugin.js').SassPlugin;
const ContentType = require('entoj-system').model.ContentType;
const ContentKind = require('entoj-system').model.ContentKind;
const DocumentationCallable = require('entoj-system').model.documentation.DocumentationCallable;
const projectFixture = require('entoj-system/test').fixture.project;
const loaderPluginSpec = require('entoj-system/test').model.loader.LoaderPluginShared;


/**
 * Spec
 */
describe(SassPlugin.className, function()
{
    /**
     * LoaderPlugin Test
     */
    loaderPluginSpec(SassPlugin, 'model.loader.documentation/SassPlugin', function(params)
    {
        params.unshift(global.fixtures.pathesConfiguration);
        return params;
    });


    /**
     * SassPlugin
     */
    beforeEach(function()
    {
        global.fixtures = projectFixture.createStatic();
    });


    describe('#execute()', function()
    {
        it('should add parsed files to files collection', function()
        {
            const testee = new SassPlugin(global.fixtures.pathesConfiguration);
            const promise = testee.execute(global.fixtures.entityTeaser).then(function()
            {
                const files = global.fixtures.entityTeaser.files;
                expect(files.filter(file => file.contentType == ContentType.SASS)).to.have.length(1);
                expect(files.find(file => file.basename == 'm-teaser.scss')).to.be.ok;
            });
            return promise;
        });

        it('should add documentation for all parsed files', function()
        {
            const testee = new SassPlugin(global.fixtures.pathesConfiguration);
            const promise = testee.execute(global.fixtures.entityGlobal).then(function()
            {
                const documentation = global.fixtures.entityGlobal.documentation;
                expect(documentation.filter(doc => doc.contentKind == ContentKind.CSS)).to.have.length(11);
                expect(documentation.find(doc => doc.name == 'maintain-aspect-ratio')).to.be.instanceof(DocumentationCallable);
            });
            return promise;
        });
    });
});
