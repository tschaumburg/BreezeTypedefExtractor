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
import * as btoptions from "./options";
import * as gruntns from "grunt";
module.exports = function (grunt: any)
{
    grunt.registerMultiTask('breezets', 'Task converting', function ()
    {
        var options = btoptions.getOptions(grunt, this);

        if (!options.metadata)
            throw new Error ("metadata");//done(false);//program.help();

        grunt.log.writeln('breezeinfoFile: %s', options.breezeinfoFile);
        grunt.log.writeln('metadataurl: %s', options.metadataurlValue);
        grunt.log.writeln('metadatacache: %s', options.metadataCache);
        grunt.log.writeln('outdir: %s', options.outdir);
        grunt.log.writeln('serviceurl: %s', options.serviceurl);
        grunt.log.writeln('proxyname: %s', options.proxyname);

        impl.callGenerate(grunt, options.outdir, options.metadataurlValue, options.metadata, options.serviceurl, options.proxyname);
    });

    grunt.task.registerMultiTask('dolog', 'Log stuff.', function() {
        grunt.log.writeln(this.target + ': ' + this.data);
    });
}

namespace impl
{
    export function callGenerate(
        grunt: any,
        outdir: string,
        metadataUrl: string,
        cachedMetadata: string,
        serviceurl: string,
        proxyname: string
    )
    {
        var metadata = breezets.getMetadata(metadataUrl, cachedMetadata);
        var files = breezets.generateTypescript(metadata, serviceurl, proxyname, [{ key: "flavor", value: "mmm...chocolate" }]);

        for (var n = 0; n < files.length; n++)
        {
            var filename = files[n].filename;
            filename = path.normalize(path.join(outdir, filename));
            var contents = files[n].contents;
            grunt.log.writeln(filename + ":");
            grunt.log.writeln("=============================");
            fs.writeFileSync(filename, contents);
        }
    }
}