'use strict';

/**
 * Requirements
 */
const SassLinter = require(SASS_SOURCE + '/linter/SassLinter.js').SassLinter;
const linterSpec = require('entoj-system/test').linter.LinterShared;


/**
 * Spec
 */
describe(SassLinter.className, function()
{
    /**
     * SassLinter Fixture
     */
    const fixture =
    {
        source: '.myclass {}',
        warningRules: { 'no-empty-rulesets': 1 },
        warningCount: 1
    };

    /**
     * BaseLinter Test
     */
    linterSpec(SassLinter, 'linter/SassLinter', fixture);
});
