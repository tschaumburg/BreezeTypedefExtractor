#!/usr/bin/env node
///<reference path='./typings/index.d.ts' />
//var program: commander.ICommand = require('commander');
var program = require('commander');
var breezeref = require("breezets");
var fs = require('fs');
var http = require('http');

var metadataurlValue = null;
program
    .description('Generates Typescript typedefinitions for a Breeze data service')
    //.arguments('<metadataurl>', "The URL supplying the Breeze data service metadata")
    .arguments('<metadataurl>')
    .action(function (metadataurl)
    {
        metadataurlValue = metadataurl;
    })
    .option('-s, --servicename <servicename>', 'The name of the Breeze data service (used when naming files during code generatios)')
    .option('-u, --url <url>', '')
    .option('-n, --namespace <namespace>', '')
    .option('-p, --proxyname <proxyname>', '')
    .option('-t, --no-typedqueries', '')
    .option('-x, --no-extensions', 'Do not generate the breezeextensions.ts library file')
    .action(function (file)
    {
        if (!metadataurlValue)
            program.help();
        var servicename = program["servicename"];
        var serviceurl = program["url"];
        var namespace = program["namespace"];
        var proxyname = program["proxyname"];
        var typedqueries = !!program["typedqueries"];
        var extensions = !!program["extensions"];

        console.log('metadataurl: %s', metadataurlValue);
        console.log('servicename: %s', servicename);
        console.log('serviceurl: %s', serviceurl);
        console.log('namespace: %s', namespace);
        console.log('proxyname: %s', proxyname);
        console.log('typedqueries: %s', typedqueries);
        console.log('extensions: %s', extensions);

        callGenerate(metadataurlValue, servicename, serviceurl, namespace, proxyname, typedqueries, extensions);
    })
    .parse(process.argv);

function callGenerate(metadataurl, servicename, serviceurl, namespace, proxyname, typedqueries, extensions)
{
    var metadata = getMetadata(metadataurl);
    var files = breezeref.generateTypescript(servicename, metadata, serviceurl, namespace, proxyname, typedqueries, extensions, [{ key: "flavor", value: "mmm...chocolate" }]);

    for (var n = 0; n < files.length; n++)
    {
        var filename = files[n].filename;
        var contents = files[n].contents;
        console.log(filename + ":");
        console.log("=============================");
        fs.writeFileSync(filename, contents);
    }
}

function getMetadata(urlstr: string): string
{
    var url = require("url");
    var u = url.parse(urlstr);

    if (u.protocol == null || u.protocol.toLowerCase() === 'file')
    {
        var filename = u.pathname;
        return fs.readFileSync(filename, 'utf8');
    }
    else
    {
        var request = require('sync-request');
        var res = request('GET', urlstr);
        var metadata = res.getBody('utf8');
        
        return metadata;
    }
    
}

// see https://developer.atlassian.com/blog/2015/11/scripting-with-node/