﻿var path = require('path');
var replaceExt = require('replace-ext');
var xml2js = require('xml2js');
var breezets = require('breezets');

export class IBreezetsOptions
{
    breezeinfoFile?: string = null;
    metadataurlValue?: string = null;
    metadataCache?: string = null;
    metadata?: string = null;
    outdir?: string = null;
    servicename?: string = null;
    serviceurl?: string = null;
    proxyname?: string = null;
    extensions?: string = null;
    namespace?: string = null;
    typedqueries?: string = null;
};

function defaultOptions(): IBreezetsOptions
{
    var options: IBreezetsOptions = 
    {
        extensions: 'true',
        typedqueries: 'true',
    };
    return options;
}

function breezeinfoOptions(grunt, breezeinfoFile: string): IBreezetsOptions
{
    var breezeinfo: IBreezetsOptions = {};
    if (!!breezeinfoFile)
    {
        try
        {
            var breezeinfoText = grunt.file.read(breezeinfoFile);
            xml2js.parseString(breezeinfoText, function (err, result) {
                grunt.log.writeln("result = " + JSON.stringify(result));
                grunt.log.writeln("err = " + JSON.stringify(err));
                breezeinfo.metadataurlValue = result && result.BreezeService && result.BreezeService.MetadataUrl && result.BreezeService.MetadataUrl[0];
                var output = result && result.BreezeService && result.BreezeService.Output && result.BreezeService.Output[0]
                var attribs = output && output.Typescript && output.Typescript[0] && output.Typescript[0].$
                breezeinfo.servicename = null;//attribs && attribs.;
                breezeinfo.serviceurl = null;//attribs && attribs.;
                breezeinfo.proxyname = attribs && attribs.proxyname;
                breezeinfo.extensions = attribs && attribs.extension;
                breezeinfo.namespace = attribs && attribs.namespace;
                breezeinfo.typedqueries = attribs && attribs.generateTypedQueries;
                grunt.log.writeln("breezeinfo = " + JSON.stringify(breezeinfo));
            });
        } catch (reason)
        {
            grunt.log.writeln(reason);
            throw reason;
        }
    }
    return breezeinfo;
}

function mergeOptions(primaryOptions: IBreezetsOptions, secondaryOptions: IBreezetsOptions, defaultOptions: IBreezetsOptions): IBreezetsOptions
{
    var result: IBreezetsOptions = 
        {
            metadataurlValue: primaryOptions.metadataurlValue || secondaryOptions.metadataurlValue || defaultOptions.metadataurlValue,
            metadataCache: primaryOptions.metadataCache || secondaryOptions.metadataCache || defaultOptions.metadataCache,
            metadata: primaryOptions.metadata || secondaryOptions.metadata || defaultOptions.metadata,
            servicename: primaryOptions.servicename || secondaryOptions.servicename || defaultOptions.servicename,
            outdir: primaryOptions.outdir || secondaryOptions.outdir || defaultOptions.outdir,
            serviceurl: primaryOptions.serviceurl || secondaryOptions.serviceurl || defaultOptions.serviceurl,
            proxyname: primaryOptions.proxyname || secondaryOptions.proxyname || defaultOptions.proxyname,
            extensions: primaryOptions.extensions || secondaryOptions.extensions || defaultOptions.extensions,//'true',
            namespace: primaryOptions.namespace || secondaryOptions.namespace || defaultOptions.namespace,
            typedqueries: primaryOptions.typedqueries || secondaryOptions.typedqueries  || defaultOptions.typedqueries,//|| 'true',
        };
    return result;
}

function GetMetadata(grunt, url: string, cachefile: string, verbatim: string): string
{
    if (!!verbatim)
        return verbatim;

    if (!!cachefile)
        return grunt.file.read(cachefile);

    if (!!url)
        return breezets.getMetadata(url, null);

    return null;
}

function getDir(grunt, fileordir: string): string
{
    if (fileordir==="")
        fileordir = ".";

    if (!fileordir)
        return null;

    var matches = grunt.file.expand(fileordir);

    if (!matches)
        return null;

    if (!matches[0])
        return null;

    return path.dirname(matches[0]);
}

export function getOptions(grunt, task): IBreezetsOptions
{
        // Merge task-specific and/or target-specific options with these defaults.
        var _defaultOptions = defaultOptions();
        var _gruntfileOptions: IBreezetsOptions = task.options(new IBreezetsOptions());
        var _breezeinfo = breezeinfoOptions(grunt, _gruntfileOptions.breezeinfoFile);
        var _merged = mergeOptions(_gruntfileOptions, _breezeinfo, _defaultOptions);

        if (!_merged.metadataCache)
        {
            if (!!_gruntfileOptions.breezeinfoFile)
            {
                grunt.log.writeln("Setting metadataCache from " + _gruntfileOptions.breezeinfoFile);
                _merged.metadataCache = replaceExt(_gruntfileOptions.breezeinfoFile, '.metadata');
                grunt.log.writeln("...got " + _merged.metadataCache);
            }
        }

        if (!_merged.metadata)
            _merged.metadata = GetMetadata(grunt, _merged.metadataurlValue, _merged.metadataCache, _merged.metadata);

        if (!_merged.outdir)
        {
            grunt.log.writeln("Setting outdir from " + _gruntfileOptions.breezeinfoFile);
            _merged.outdir = getDir(grunt, _gruntfileOptions.breezeinfoFile);
            grunt.log.writeln("...got " + _merged.outdir);
        }

        if (!_merged.outdir)
        {
            grunt.log.writeln("Setting outdir from .");
            _merged.outdir = getDir(grunt, ".");
            grunt.log.writeln("...got " + _merged.outdir);
        }

        return _merged;
}