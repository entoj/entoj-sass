'use strict';

/**
 * Requirements
 */
const SassFileLinter = require(SASS_SOURCE + '/linter/SassFileLinter.js').SassFileLinter;
const fileLinterSpec = require('entoj-system/test').linter.FileLinterShared;
const path = require('path');


/**
 * Spec
 */
describe(SassFileLinter.className, function()
{
    /**
     * JsFileLinter Fixture
     */
    const fixture =
    {
        root: path.join(SASS_FIXTURES, '/files'),
        glob: ['/*.scss'],
        globCount: 2
    };


    /**
     * FileLinter Test
     */
    fileLinterSpec(SassFileLinter, 'linter/SassFileLinter', fixture);
});
