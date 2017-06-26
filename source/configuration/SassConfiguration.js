'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * @memberOf configuration
 */
class SassConfiguration extends Base
{
    /**
     * @param  {model.configuration.GlobalConfiguration} globalConfiguration
     */
    constructor(globalConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);

        // Create configuration
        this._bundlePath = globalConfiguration.get('sass.bundlePath', '${cache}/sass/bundles');
        this._includePathes = globalConfiguration.get('sass.includePathes', []);
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [GlobalConfiguration] };
    }


    /**
     * @inheritDocss
     */
    static get className()
    {
        return 'configuration/SassConfiguration';
    }


    /**
     * Path to a folder where compiled sass bundles are stored
     *
     * @type {String}
     */
    get bundlePath()
    {
        return this._bundlePath;
    }


    /**
     * Path to sass include folders
     *
     * @type {Array}
     */
    get includePathes()
    {
        return this._includePathes;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassConfiguration = SassConfiguration;
