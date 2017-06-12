'use strict';

/**
 * Configure path
 */
const path = require('path');
global.SASS_SOURCE = path.resolve(__dirname + '/../source');
global.SASS_FIXTURES = path.resolve(__dirname + '/__fixtures__');
global.SASS_TEST = __dirname;


/**
 * Configure chai
 */
const chai = require('chai');
chai.config.includeStack = true;
global.expect = chai.expect;
