/*
 * grunt-jsonconst
 * https://github.com/Thomas/grunt-jsonconst
 *
 * Copyright (c) 2016 tschaumburg
 * Licensed under the MIT license.
 */

'use strict';
var breezets = require('breezets');
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');

import * as btoptions from "./options";
module.exports = function (grunt)
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
        grunt.log.writeln('servicename: %s', options.servicename);
        grunt.log.writeln('serviceurl: %s', options.serviceurl);
        grunt.log.writeln('namespace: %s', options.namespace);
        grunt.log.writeln('proxyname: %s', options.proxyname);
        grunt.log.writeln('typedqueries: %s', options.typedqueries);
        grunt.log.writeln('extensions: %s', options.extensions);

        impl.callGenerate(grunt, options.outdir, options.metadataurlValue, options.metadata, options.servicename, options.serviceurl, options.namespace, options.proxyname, options.typedqueries, options.extensions);
    });

    grunt.task.registerMultiTask('dolog', 'Log stuff.', function() {
        grunt.log.writeln(this.target + ': ' + this.data);
    });
}

namespace impl
{
    export function callGenerate(grunt, outdir, metadataUrl, cachedMetadata, servicename, serviceurl, namespace, proxyname, typedqueries, extensions)
    {
        var metadata = breezets.getMetadata(metadataUrl, cachedMetadata);
        var files = breezets.generateTypescript(servicename, metadata, serviceurl, namespace, proxyname, typedqueries, extensions, [{ key: "flavor", value: "mmm...chocolate" }]);

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