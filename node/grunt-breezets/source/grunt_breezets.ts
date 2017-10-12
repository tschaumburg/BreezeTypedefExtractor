/*
 * grunt-jsonconst
 * https://github.com/Thomas/grunt-jsonconst
 *
 * Copyright (c) 2016 tschaumburg
 * Licensed under the MIT license.
 */

'use strict';
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');

import * as breezets from 'breezets';
//import * as btoptions from "./options";
import * as gruntns from "grunt";
module.exports = function (grunt: any)
{
    grunt.registerMultiTask('breezets', 'Task converting', function ()
    {
        var options: breezets.IBreezetsOptions = this.options(new breezets.IBreezetsOptions());

        grunt.log.writeln('breezeinfoFile: %s', options.breezeinfoFile);
        grunt.log.writeln('metadataurl: %s', options.metadataurlValue);
        grunt.log.writeln('metadatacache: %s', options.metadataCache);
        grunt.log.writeln('outdir: %s', options.outdir);
        grunt.log.writeln('serviceurl: %s', options.serviceurl);
        grunt.log.writeln('proxyname: %s', options.proxyname);

        impl.callGenerate(options);
    });
}

namespace impl
{
    export function callGenerate(
        options: breezets.IBreezetsOptions
    ): void
    {
        breezets.generateTypescript(options);
    }
}