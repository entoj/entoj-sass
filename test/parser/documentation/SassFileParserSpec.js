'use strict';

/**
 * Requirements
 */
const SassFileParser = require(SASS_SOURCE + '/parser/documentation/SassFileParser.js').SassFileParser;
const fileParserSpec = require('entoj-system/test').parser.FileParserShared;
const path = require('path');


/**
 * Spec
 */
describe(SassFileParser.className, function()
{
    /**
     * SassFileLinter Fixture
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
    fileParserSpec(SassFileParser, 'parser.documentation/SassFileParser', fixture);
});
