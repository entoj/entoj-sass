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
    loaderPluginSpec(SassPlugin, 'sass.model.loader.documentation/SassPlugin', function(params)
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


    xdescribe('#execute()', function()
    {
        it('should add all parsed files to files', function()
        {
            const testee = new SassPlugin(fixtures.pathes);
            const promise = testee.execute(fixtures.entityGallery).then(function()
            {
                const files = fixtures.entityGallery.files;
                expect(files.filter(file => file.contentType == ContentType.SASS)).to.have.length(1);
                expect(files.find(file => file.basename == 'm001-gallery.scss')).to.be.ok;
            });
            return promise;
        });

        it('should add documentation for all parsed files', function()
        {
            const testee = new SassPlugin(fixtures.pathes);
            const promise = testee.execute(fixtures.entityGallery).then(function()
            {
                const documentation = fixtures.entityGallery.documentation;
                expect(documentation.filter(doc => doc.contentKind == ContentKind.CSS)).to.have.length(1);
                expect(documentation.find(doc => doc.name == 'm001_gallery-button-size')).to.be.instanceof(DocumentationCallable);
            });
            return promise;
        });
    });
});
