const fs = require("node-fs");

export function GetMetadata(url: string, cachefile: string, verbatim: string): string
{
    if (!!verbatim)
        return verbatim;

    try
    {
        if (!!url)
            return loadMetadataUrl(url);
    }
    catch (reason) { }

    if (!!cachefile)
        if (isFile(cachefile))
            return fs.readFileSync(cachefile, "utf8");

    return null;
}

function getMetadata2(url: string, cached: string): string
{
    if (!url)
        return cached;
        
    try
    {
        return loadMetadataUrl(url);
    }
    catch(err)
    {
        // warn that we are fa lli ng back to the cache
        return cached;
    }
}

function loadMetadataUrl(urlstr: string): string
{
    var url = require("url");
    var u = url.parse(urlstr);

    if (u.protocol == null || u.protocol.toLowerCase() === 'file' || u.protocol.toLowerCase() ===  'file:')
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

function isFile(filename: string): boolean
{
    try
    {
        return fs.lstatSync(filename).isFile()
    } catch (e)
    {
        return false;
    }
}

