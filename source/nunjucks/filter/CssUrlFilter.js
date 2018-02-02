'use strict';

/**
 * Requirements
 * @ignore
 */
const Filter = require('entoj-system').nunjucks.filter.Filter;
const SassConfiguration = require('../../configuration/SassConfiguration.js').SassConfiguration;
const urls = require('entoj-system').utils.urls;
const templateString = require('es6-template-strings');


/**
 * Generates a css url.
 *
 * @memberOf nunjucks.filter
 */
class CssUrlFilter extends Filter
{
    /**
     * @inheritDoc
     */
    constructor(moduleConfiguration)
    {
        super();
        this._name = ['cssUrl', 'css'];
        this._moduleConfiguration = moduleConfiguration;
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [SassConfiguration] };
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'nunjucks.filter/CssUrlFilter';
    }


    /**
     * @type {configuration.SassConfiguration}
     */
    get moduleConfiguration()
    {
        return this._moduleConfiguration;
    }


    /**
     * @type {String}
     */
    get baseUrl()
    {
        if (this.environment &&
            this.environment.buildConfiguration)
        {
            return this.environment.buildConfiguration.get('filters.cssUrl');
        }
        return false;
    }


    /**
     * @inheritDoc
     */
    filter(value)
    {
        const scope = this;
        return function(value, group)
        {
            const globals = scope.getGlobals(this);
            const site = value || globals.location.site;
            const groupName = group || scope.moduleConfiguration.defaultGroup;
            let url = templateString(scope.moduleConfiguration.bundleUrl, { site: site, group: groupName });
            if (scope.baseUrl)
            {
                url = urls.concat(scope.baseUrl, url);
            }
            return scope.applyCallbacks(url, arguments, { site: site, group: groupName, baseUrl: scope.baseUrl });
        };
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.CssUrlFilter = CssUrlFilter;
