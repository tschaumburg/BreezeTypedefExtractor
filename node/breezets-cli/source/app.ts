#!/usr/bin/env node
//var program: commander.ICommand = require('commander');
var program = require('commander');
import * as breezeref from "breezets";
require("breezets");
var fs = require('fs');
var http = require('http');

var metadataurlValue: string = null;
program
    .description('Generates Typescript typedefinitions for a Breeze data service')
    //.arguments('<metadataurl>', "The URL supplying the Breeze data service metadata")
    .arguments('<metadataurl>')
    .action(function (metadataurl: string)
    {
        metadataurlValue = metadataurl;
    })
    .option('-s, --servicename <servicename>', 'The name of the Breeze data service (used when naming files during code generatios)')
    .option('-u, --url <url>', '')
    .option('-n, --namespace <namespace>', '')
    .option('-p, --proxyname <proxyname>', '')
    .option('-t, --no-typedqueries', '')
    .option('-x, --no-extensions', 'Do not generate the breezeextensions.ts library file')
    .action(function (file: any)
    {
        if (!metadataurlValue)
            program.help();
        var serviceurl = program["url"];
        var proxyname = program["proxyname"];

        console.log('metadataurl: %s', metadataurlValue);
        console.log('serviceurl: %s', serviceurl);
        console.log('proxyname: %s', proxyname);

        callGenerate(metadataurlValue, serviceurl, proxyname);
    })
    .parse(process.argv);

function callGenerate(
    metadataurl: string,
    serviceurl: string,
    proxyname: string
)
{
    var metadata = getMetadata(metadataurl);
        var files = breezeref.generateTypescript(metadata, serviceurl, proxyname, [{ key: "flavor", value: "mmm...chocolate" }]);

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

    if (u.protocol == null || u.protocol.toLowerCase() === 'file' || u.protocol.toLowerCase() === 'file:')
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