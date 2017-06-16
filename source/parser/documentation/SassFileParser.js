'use strict';

/**
 * Requirements
 * @ignore
 */
const FileParser = require('entoj-system').parser.FileParser;
const SassParser = require('./SassParser.js').SassParser;
const ContentType = require('entoj-system').model.ContentType;
const ContentKind = require('entoj-system').model.ContentKind;


/**
 * A scss to documentation parser
 *
 * @class
 * @extends parser.FileParser
 * @memberOf parser.documentation
 */
class SassFileParser extends FileParser
{
    /**
     * @param {Object} options
     */
    constructor(options)
    {
        super(options);

        const opts = options || {};
        this._parser = new SassParser(opts);
        this._glob = opts.glob || ['/*.scss', '/sass/*.scss'];
        this._fileType = opts.fileType || ContentType.SASS;
        this._fileKind = opts.fileKind || ContentKind.CSS;
    }


    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'parser.documentation/SassFileParser';
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassFileParser = SassFileParser;
