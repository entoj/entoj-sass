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
const ErrorHandler = require('entoj-system').error.ErrorHandler;
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
    parseNode(node, comment)
    {
        const scope = this;
        const promise = co(function*()
        {
            // Prepare
            const result = [];

            // Parse
            let currentComment = comment;
            for (const token of node.content)
            {
                switch (token.type)
                {
                    case 'multilineComment':
                        currentComment = '/*' + token.content + '*/';
                        break;

                    case 'declaration':
                        if (currentComment)
                        {
                            const documentation = yield scope._parser.parse(currentComment, { contentType: ContentType.SASS });
                            if (documentation instanceof DocumentationVariable)
                            {
                                documentation.contentType = ContentType.SASS;
                                documentation.contentKind = ContentKind.CSS;

                                const variableName = token.first('property').first('variable').first('ident').content;
                                documentation.name = '$' + variableName;
                                // @todo add value parsing
                                result.push(documentation);
                            }
                            currentComment = false;
                        }
                        break;

                    case 'ruleset':
                        if (currentComment)
                        {
                            const selectors = token.content.filter(item => item.type == 'selector');
                            for (const selector of selectors)
                            {
                                const documentation = yield scope._parser.parse(currentComment, { contentType: ContentType.SASS });
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
                            currentComment = false;
                        }
                        break;

                    case 'mixin':
                    case 'function':
                        if (currentComment)
                        {
                            const documentation = yield scope._parser.parse(currentComment, { contentType: ContentType.SASS });
                            if (documentation instanceof DocumentationCallable)
                            {
                                const mixinName = token.first('ident').content;
                                documentation.contentType = ContentType.SASS;
                                documentation.contentKind = ContentKind.CSS;
                                documentation.name = mixinName;
                                const args = token.content.find(item => item.type === 'arguments');
                                if (args)
                                {
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
                                }
                                result.push(documentation);
                            }
                            currentComment = false;
                        }
                        break;

                    case 'space':
                        break;

                    case 'declarationDelimiter':
                        currentComment = false;
                        break;

                    case 'atrule':
                        const childResult = yield scope.parseNode(token, currentComment);
                        result.push(...childResult);
                        break;

                    default:
                        break;
                }
            }

            return result;
        }).catch(ErrorHandler.handler(scope));

        return promise;
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
            const contents = trimMultiline(content);

            // Get ast
            let ast;
            try
            {
                ast = gonzales.parse(contents, { syntax: 'scss' });
            }
            catch(e)
            {
                scope.logger.error(e);
                ast = false;
            }
            if (!ast)
            {
                return [];
            }

            // Parse
            const result = yield scope.parseNode(ast);
            return result;
        });

        return promise;
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.SassParser = SassParser;
