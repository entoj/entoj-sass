/**
 * @namespace sass
 */
module.exports =
{
    command: require('./command/index.js'),
    linter: require('./linter/index.js'),
    model: require('./model/index.js'),
    parser: require('./parser/index.js'),
    task: require('./task/index.js')
};
