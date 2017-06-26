'use strict';

/**
 * Requirements
 */
const SassRoute = require(SASS_SOURCE + '/server/route/SassRoute.js').SassRoute;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const GlobalConfiguration = require('entoj-system').model.configuration.GlobalConfiguration;
const SassConfiguration = require(SASS_SOURCE + '/configuration/SassConfiguration.js').SassConfiguration;
const routeSpec = require('entoj-system/test').server.RouteShared;


/**
 * Spec
 *
 * @todo add tests for actual serving files
 */
describe(SassRoute.className, function()
{
    /**
     * Route Test
     */
    routeSpec(SassRoute, 'server.route/SassRoute', function(parameters)
    {
        const globalConfiguration = new GlobalConfiguration();
        const sassConfiguration = new SassConfiguration(globalConfiguration);
        const pathesConfiguration = new PathesConfiguration();
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger, pathesConfiguration, sassConfiguration];
    });
});
