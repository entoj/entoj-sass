
/**
 * Registers with default configurations
 */
function register(configuration, options)
{
    // Settings
    configuration.settings.add(
        {
            sass:
            {
                includePathes: ['${entoj}/node_modules']
            }
        });

    // Commands
    configuration.commands.add(require('./command/index.js').SassCommand);

    // Entities
    configuration.mappings.add(require('entoj-system').model.entity.EntitiesLoader,
        {
            '!plugins':
            [
                require('./model/index.js').loader.documentation.SassPlugin
            ]
        });

    // Linter
    configuration.commands.add(require('entoj-system').command.LintCommand,
        {
            '!linters':
            [
                {
                    type: require('./linter/index.js').SassFileLinter,
                    options:
                    {
                        useDefaultRules: true
                    }
                }
            ]
        });

    // Nunjucks filter
    configuration.mappings.add(require('entoj-system').nunjucks.Environment,
        {
            '!filters':
            [
                configuration.clean(
                    {
                        type: require('./nunjucks/index.js').filter.CssUrlFilter
                    })
            ]
        }
    );

    // Routes
    configuration.commands.add(require('entoj-system').command.ServerCommand,
        {
            options:
            {
                routes:
                [
                    {
                        type: require('./server/index.js').route.SassRoute
                    }
                ]
            }
        });
}


/**
 * Exports
 * @ignore
 */
module.exports =
{
    register: register,
    command: require('./command/index.js'),
    linter: require('./linter/index.js'),
    model: require('./model/index.js'),
    parser: require('./parser/index.js'),
    server: require('./server/index.js'),
    task: require('./task/index.js')
};
