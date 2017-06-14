'use strict';

/**
 * Requirements
 */
const SassRoute = require(SASS_SOURCE + '/server/route/SassRoute.js').SassRoute;
const CliLogger = require('entoj-system').cli.CliLogger;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const routeSpec = require('entoj-system/test').server.RouteShared;


/**
 * Spec
 */
describe(SassRoute.className, function()
{
    /**
     * Route Test
     */
    routeSpec(SassRoute, 'sass.server.route/SassRoute', function(parameters)
    {
        const pathesConfiguration = new PathesConfiguration();
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger, pathesConfiguration];
    });
});
