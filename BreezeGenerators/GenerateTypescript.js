var breeze = require( 'breeze-ref' );
module.exports = function ( data, callback )
{
    // Extract the call parameters:
    var params = JSON.parse( data );
    var serviceName = params.serviceName;
    var metadata = params.metadata;
    var attributes = params.attributes;
    var serviceUrl = params.serviceUrl;

    var framework = "none";
    var extension = ".d.ts";
    var namespace = null;
    var proxyname = null;
    var generateTypedQueries = true;
    if ( attributes )
    {
        if ( attributes.framework )
            framework = attributes.framework;

        if ( attributes.extension )
            extension = attributes.extension;

        if ( attributes.namespace )
            namespace = attributes.namespace;

        if ( attributes.proxyname )
        {
            proxyname = attributes.proxyname;

            if ( attributes.generateTypedQueries )
                generateTypedQueries = attributes.generateTypedQueries;
        }
    }

    // Calculate the target file name (<source.xxx => <source>.d.ts)
    //var targetFile = sourceFile;
    //var lastDotAt = targetFile.lastIndexOf( "." );
    //if ( lastDotAt >= 0 )
    //    targetFile = targetFile.substr( 0, lastDotAt ) + extension;

    var result = breezeref.generateTypescript( serviceName, metadata, serviceUrl, namespace, proxyname, generateTypedQueries, attributes );

    // Return
    callback( null, result );
}