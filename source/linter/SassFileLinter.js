'use strict';

/**
 * Requirements
 * @ignore
 */
const FileLinter = require('entoj-system').linter.FileLinter;
const SassLinter = require('./SassLinter.js').SassLinter;


/**
 * A sass file linter
 *
 * @class
 * @extends external:linter.Linter
 * @memberOf linter
 * @see linter.SassLinter
 * @see https://github.com/sasstools/sass-lint/tree/master/docs/rules
 */
class SassFileLinter extends FileLinter
{
    /**
     * @param {Object} rules - A object describing all linting rules
     * @param {Object} options
     * @param {Boolean} options.useDefaultRules - When true the linter uses rules from .sass-lint.yml
     */
    constructor(rules, options)
    {
        super(options);
        const opts = options || {};
        this._linter = new SassLinter(rules || {}, opts);
        this._glob = opts.glob || ['/sass/*.scss'];
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': ['linter/SassFileLinter.rules', 'linter/SassFileLinter.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'linter/SassFileLinter';
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassFileLinter = SassFileLinter;
