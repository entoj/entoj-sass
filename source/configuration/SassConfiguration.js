'use strict';

/**
 * Requirements
 * @ignore
 */
const Base = require('entoj-system').Base;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
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
    constructor(globalConfiguration, buildConfiguration)
    {
        super();

        //Check params
        assertParameter(this, 'globalConfiguration', globalConfiguration, true, GlobalConfiguration);
        assertParameter(this, 'buildConfiguration', buildConfiguration, true, BuildConfiguration);

        // Create configuration
        this._defaultGroup = buildConfiguration.get('sass.defaultGroup', globalConfiguration.get('sass.defaultGroup', 'common'));
        this._bundleUrl = buildConfiguration.get('sass.bundleUrl', globalConfiguration.get('sass.bundleUrl', '/${site.name.urlify()}/css/${group}.css'));
        this._bundlePath = buildConfiguration.get('sass.bundlePath', globalConfiguration.get('sass.bundlePath', '${cache}/sass/bundles'));
        this._bundleTemplate = buildConfiguration.get('sass.bundleTemplate', globalConfiguration.get('sass.bundleTemplate', '${site.name.urlify()}/css/${group}.scss'));
        this._includePathes = buildConfiguration.get('sass.includePathes', globalConfiguration.get('sass.includePathes', []));
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [GlobalConfiguration, BuildConfiguration] };
    }


    /**
     * @inheritDocss
     */
    static get className()
    {
        return 'configuration/SassConfiguration';
    }


    /**
     * The name of the default group used
     * to name generated files
     *
     * @type {String}
     */
    get defaultGroup()
    {
        return this._defaultGroup;
    }


    /**
     * Url to a compiled bundle
     * Defaults to "/${site.name.urlify()}/css/${group}.css"
     *
     * @type {String}
     */
    get bundleUrl()
    {
        return this._bundleUrl;
    }


    /**
     * Path to a folder where compiled sass bundles are stored.
     * Defaults to "${cache}/sass/bundles"
     *
     * @type {String}
     */
    get bundlePath()
    {
        return this._bundlePath;
    }


    /**
     * Template for bundle filename generation.
     * Defaults to "${site.name.urlify()}/css/${group}.scss"
     *
     * @type {String}
     */
    get bundleTemplate()
    {
        return this._bundleTemplate;
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
