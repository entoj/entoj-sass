'use strict';

/**
 * Requirements
 */
const SassConfiguration = require(SASS_SOURCE + '/configuration/SassConfiguration.js').SassConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const baseSpec = require('entoj-system/test').BaseShared;


/**
 * Spec
 */
describe(SassConfiguration.className, function()
{
    /**
     * Base Test
     */
    baseSpec(SassConfiguration, 'configuration/SassConfiguration', function(parameters)
    {
        return [new GlobalConfiguration()];
    });


    /**
     * SassConfiguration Test
     */

    // create a initialized testee instance
    const createTestee = function(config)
    {
        return new SassConfiguration(new GlobalConfiguration(config));
    };

    // Simple properties
    baseSpec.assertProperty(createTestee(), ['includePathes'], undefined, []);
    baseSpec.assertProperty(createTestee(), ['bundlePath'], undefined, '${cache}/sass/bundles');

    // Configuration via contructor
    describe('#constructor', function()
    {
        baseSpec.assertProperty(createTestee({ sass: { includePathes: ['/configured'] } }), ['includePathes'], undefined, ['/configured']);
        baseSpec.assertProperty(createTestee({ sass: { bundlePath: '/configured' } }), ['bundlePath'], undefined, '/configured');
    });
});
