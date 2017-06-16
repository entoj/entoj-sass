'use strict';


/**
 * Requirements
 * @ignore
 */
const Parser = require('entoj-system').parser.Parser;
const DocBlockParser = require('entoj-system').parser.documentation.DocBlockParser;
const ContentType = require('entoj-system').model.ContentType;
const ContentKind = require('entoj-system').model.ContentKind;
const DocumentationCallable = require('entoj-system').model.documentation.DocumentationCallable;
const DocumentationVariable = require('entoj-system').model.documentation.DocumentationVariable;
const DocumentationClass = require('entoj-system').model.documentation.DocumentationClass;
const DocumentationParameter = require('entoj-system').model.documentation.DocumentationParameter;
const trimMultiline = require('entoj-system').utils.string.trimMultiline;
const co = require('co');
const gonzales = require('gonzales-pe');


/**
 * A sass to documentation parser
 *
 * @class
 * @extends parser.Parser
 * @memberOf parser.documentation
 */
class SassParser extends Parser
{
    /**
     * @param {Object} options
     */
    constructor(options)
    {
        super(options);

        this._parser = new DocBlockParser();
    }

    /**
     * @inheritDoc
     */
    static get className()
    {
        return 'parser.documentation/SassParser';
    }


    /**
     * @param {string} content
     * @param {string} options
     * @returns {Promise<Array>}
     */
    parse(content, options)
    {
        if (!content || content.trim() === '')
        {
            Promise.resolve(false);
        }

        const scope = this;
        const promise = co(function*()
        {
            // Prepare
            const result = [];
            const contents = trimMultiline(content);
            let ast;

            // Get ast
            try
            {
                ast = gonzales.parse(contents, { syntax: 'scss' });
            }
            catch(e)
            {
                ast = false;
            }
            if (!ast)
            {
                return result;
            }

            // Parse
            let comment = false;
            for (const token of ast.content)
            {
                switch (token.type)
                {
                    case 'multilineComment':
                        comment = '/*' + token.content + '*/';
                        break;

                    case 'declaration':
                        if (comment)
                        {
                            const documentation = yield scope._parser.parse(comment, { contentType: ContentType.SASS });
                            if (documentation instanceof DocumentationVariable)
                            {
                                documentation.contentType = ContentType.SASS;
                                documentation.contentKind = ContentKind.CSS;

                                const variableName = token.first('property').first('variable').first('ident').content;
                                documentation.name = '$' + variableName;
                                // @todo add value parsing
                                result.push(documentation);
                            }
                        }
                        break;

                    case 'ruleset':
                        if (comment)
                        {
                            const selectors = token.content.filter(item => item.type == 'selector');
                            for (const selector of selectors)
                            {
                                const documentation = yield scope._parser.parse(comment, { contentType: ContentType.SASS });
                                if (documentation instanceof DocumentationClass)
                                {
                                    const className = selector.first('class').first('ident').content;
                                    // @todo check other selectors
                                    documentation.name = '.' + className;
                                    documentation.contentType = ContentType.SASS;
                                    documentation.contentKind = ContentKind.CSS;
                                    result.push(documentation);
                                }
                            }
                        }
                        break;

                    case 'mixin':
                        if (comment)
                        {
                            const documentation = yield scope._parser.parse(comment, { contentType: ContentType.SASS });
                            if (documentation instanceof DocumentationCallable)
                            {
                                const mixinName = token.first('ident').content;
                                documentation.contentType = ContentType.SASS;
                                documentation.contentKind = ContentKind.CSS;
                                documentation.name = mixinName;
                                const args = token.content.find(item => item.type === 'arguments');
                                const types = ['variable'];
                                args.traverseByTypes(types, function(node, index, parent)
                                {
                                    const name = '$' + node.first('ident').content;
                                    if (!documentation.parameters.find(item => item.name === name))
                                    {
                                        const parameter = new DocumentationParameter();
                                        parameter.name = name;
                                        documentation.parameters.push(parameter);
                                    }
                                });
                                result.push(documentation);
                            }
                        }
                        break;

                    case 'space':
                        break;

                    case 'declarationDelimiter':
                        comment = false;
                        break;

                    default:
                        comment = false;
                        break;
                }
            }

            return result;
        })
        .catch(function(error)
        {
            throw new Error('SassParser - ' + error);
        });

        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassParser = SassParser;
