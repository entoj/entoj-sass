'use strict';

/**
 * Requirements
 */
const SassRoute = require(SASS_SOURCE + '/server/route/StaticFileRoute.js').StaticFileRoute;
const CliLogger = require('entoj-system').cli.CliLogger;
const routeSpec = require('entoj-system/test').server.RouteShared;


/**
 * Spec
 */
describe(SassRoute.className, function()
{
    /**
     * Route Test
     */
    routeSpec(SassRoute, 'server.route/SassRoute', function(parameters)
    {
        const cliLogger = new CliLogger('', { muted: true });
        return [cliLogger];
    });
});
