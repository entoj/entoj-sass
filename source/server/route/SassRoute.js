'use strict';

/**
 * Requirements
 * @ignore
 */
const Route = require('entoj-system').server.route.Route;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const SassConfiguration = require('../../configuration/SassConfiguration.js').SassConfiguration;
const waitForPromise = require('entoj-system').utils.synchronize.waitForPromise;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * A route to serve compiled sass files
 *
 * @memberOf server.route
 */
class SassRoute extends Route
{
    /**
     * @param {cli.CliLogger} cliLogger
     */
    constructor(cliLogger, pathesConfiguration, sassConfiguration)
    {
        super(cliLogger.createPrefixed('route.sassroute'));

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);
        assertParameter(this, 'sassConfiguration', sassConfiguration, true, SassConfiguration);

        // Assign options
        this._basePath = waitForPromise(pathesConfiguration.resolve(sassConfiguration.bundlePath));
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration, SassConfiguration] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'server.route/SassRoute';
    }


    /**
     * @type {String}
     */
    get basePath()
    {
        return this._basePath;
    }


    /**
     * @inheritDocs
     */
    register(server)
    {
        const promise = super.register(server);
        promise.then(() =>
        {
            if (server)
            {
                this.addStaticFileHandler('*', this.basePath, ['.css']);
            }
        });
        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassRoute = SassRoute;
