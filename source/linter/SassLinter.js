'use strict';

/**
 * Requirements
 * @ignore
 */
const Linter = require('entoj-system').linter.Linter;
const ContentKind = require('entoj-system').model.ContentKind;
const sassLint = require('sass-lint');


/**
 * A sass linter based on sass-lint
 *
 * @class
 * @extends external:linter.Linter
 * @memberOf linter
 * @see https://github.com/sasstools/sass-lint/tree/master/docs/rules
 */
class SassLinter extends Linter
{
    /**
     * @param {Object} rules - A object describing all linting rules
     * @param {Object} options
     * @param {Boolean} options.useDefaultRules - When true the linter uses rules from .sass-lint.yml
     */
    constructor(rules, options)
    {
        super();

        const opts = options || {};
        const ruleMap = rules || {};
        this._options =
        {
            options:
            {
                'merge-default-rules': opts.useDefaultRules || false
            }
        };
        if (Object.keys(ruleMap).length)
        {
            this._options.rules = ruleMap;
            this._options.options['merge-default-rules'] = false;
        }
    }


    /**
     * @inheritDocs
     */
    static get injections()
    {
        return { 'parameters': ['linter/SassLinter.rules', 'linter/SassLinter.options'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'linter/SassLinter';
    }


    /**
     * @type {String}
     */
    get name()
    {
        return 'SASS';
    }


    /**
     * @type {String}
     */
    get contentKind()
    {
        return ContentKind.CSS;
    }


    /**
     * @param {String} content - The source that will be linted
     * @param {Object} options
     * @param {String} options.filename - The filename if source comes from a file
     * @returns {Promise<Array>}
     */
    lint(content, options)
    {
        if (!content || content.trim() === '')
        {
            return Promise.resolve({ success: true, errorCount: 0, warningCount: 0, messages:[] });
        }
        const linted = sassLint.lintText(
            {
                'text': content,
                'format': 'scss',
                'filename': ''
            }, this._options);
        const result =
        {
            success: (linted.errorCount == 0 && linted.warningCount == 0),
            errorCount: linted.errorCount,
            warningCount: linted.warningCount,
            messages: linted.messages
        };
        const opts = options || {};
        const scope = this;
        result.messages = result.messages.map(function(message)
        {
            if (opts.filename)
            {
                message.filename = opts.filename;
            }
            message.linter = scope.className;
            return message;
        });

        return Promise.resolve(result);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassLinter = SassLinter;
