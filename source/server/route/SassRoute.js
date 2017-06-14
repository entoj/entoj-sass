'use strict';

/**
 * Requirements
 * @ignore
 */
const Route = require('entoj-system').server.route.Route;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const assertParameter = require('entoj-system').utils.assert.assertParameter;


/**
 * A route to serve compiled sass files
 *
 * @memberOf sass.server.routes
 */
class SassRoute extends Route
{
    /**
     * @param {cli.CliLogger} cliLogger
     */
    constructor(cliLogger, pathesConfiguration)
    {
        super(cliLogger.createPrefixed('route.sassroute'));

        //Check params
        assertParameter(this, 'pathesConfiguration', pathesConfiguration, true, PathesConfiguration);

        // Assign options
        this._pathesConfiguration = pathesConfiguration;
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': [CliLogger, PathesConfiguration] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'sass.server.route/SassRoute';
    }


    /**
     * @type {model.configuration.PathesConfiguration}
     */
    get pathesConfiguration()
    {
        return this._pathesConfiguration;
    }


    /**
     * @inheritDocs
     */
    register(express)
    {
        super.register(express);
        this.pathesConfiguration.resolveCache('/css')
            .then((path) =>
            {
                this.addStaticFileHandler('*', path, ['.css']);
            }
        );
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassRoute = SassRoute;
