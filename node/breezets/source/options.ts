'use strict';

const fs = require("node-fs");
var path = require('path');
var replaceExt = require('replace-ext');
var xml2js = require('xml2js');
var metadata = require('./metadata');

export class IBreezetsOptions
{
    breezeinfoFile?: string = null;
    metadataurlValue?: string = null;
    metadataCache?: string = null;
    metadata?: string = null;
    outdir?: string = null;
    serviceurl?: string = null;
    proxyname?: string = null;
};

export function expandOptions(rawOptions: IBreezetsOptions)
{
    var _defaultOptions = defaultOptions();
    var _breezeinfo = breezeinfoOptions(rawOptions.breezeinfoFile);
    var _merged = mergeOptions(rawOptions, _breezeinfo, _defaultOptions);

    if (!_merged.metadataCache)
    {
        if (!!rawOptions.breezeinfoFile)
        {
            _merged.metadataCache = replaceExt(rawOptions.breezeinfoFile, '.metadata');
        }
    }

    if (!_merged.metadata)
        _merged.metadata = metadata.GetMetadata(_merged.metadataurlValue, _merged.metadataCache, _merged.metadata);

    if (!_merged.outdir)
    {
        _merged.outdir = getDir(rawOptions.breezeinfoFile);
    }

    if (!_merged.outdir)
    {
        _merged.outdir = getDir(".");
    }

    return _merged;
}

function defaultOptions(): IBreezetsOptions
{
    var options: IBreezetsOptions = 
    {
    };
    return options;
}

function breezeinfoOptions(breezeinfoFile: string): IBreezetsOptions
{
    var breezeinfo: IBreezetsOptions = {};
    if (!!breezeinfoFile)
    {
        try
        {
            var breezeinfoText = fs.readFileSync(breezeinfoFile, "utf8");
            xml2js.parseString(breezeinfoText, function (err: any, result: any) {

                // <MetadataUrl cachefile="./plans.metadata">
                //   http://localhost:58659//api/plans/metadata
                // </MetadataUrl>
                var metadataElement = result && result.BreezeService && result.BreezeService.MetadataUrl && result.BreezeService.MetadataUrl[0];
                if (!metadataElement)
                {
                    // no defaults
                }
                else if (typeof (metadataElement) === 'string')
                {
                    breezeinfo.metadataurlValue = metadataElement.toString().trim();
                }
                else
                {
                    breezeinfo.metadataurlValue = metadataElement._ && metadataElement._.toString().trim();
                    var metadataAttribs = metadataElement.$;
                    var cachefile = metadataAttribs && metadataAttribs.cachefile;
                    breezeinfo.metadataCache = cachefile && path.join(getDir(breezeinfoFile), cachefile);
                }

                // <Output>
                //   <Typescript outdir="." framework="angular" extension=".d.ts" proxyname="PlansManager" generateTypedQueries="true"/>
                // </Output>
                var output = result && result.BreezeService && result.BreezeService.Output && result.BreezeService.Output[0]
                var attribs = output && output.Typescript && output.Typescript[0] && output.Typescript[0].$
                breezeinfo.serviceurl = null;//attribs && attribs.;
                breezeinfo.proxyname = attribs && attribs.proxyname;
            });
        } catch (reason)
        {
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
            outdir: primaryOptions.outdir || secondaryOptions.outdir || defaultOptions.outdir,
            serviceurl: primaryOptions.serviceurl || secondaryOptions.serviceurl || defaultOptions.serviceurl,
            proxyname: primaryOptions.proxyname || secondaryOptions.proxyname || defaultOptions.proxyname,
        };
    return result;
}

function getDir(fileordir: string): string
{
    if (fileordir==="")
        fileordir = ".";

    if (!fileordir)
        return null;

    return path.dirname(fileordir);
}

//export function getOptions(grunt: any, task: any): IBreezetsOptions
//{
//    var _gruntfileOptions: IBreezetsOptions = task.options(new IBreezetsOptions());

//    return expandOptions(grunt, _gruntfileOptions);
//}
