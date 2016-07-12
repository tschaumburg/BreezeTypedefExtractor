global.window = {};
require( './js/jquery-2.1.0.js' );
global.window["Q"] = require( './js/q.js' );
var breeze = require( './js/breeze.debug.js' );
module.exports = function ( data, callback )
{
    // Extract the call parameters:
    var params = JSON.parse( data );
    var sourceFile = params.sourceFile;
    var metadata = params.metadata;

    var framework = "none";
    var extension = ".d.ts";
    var _namespace = null;
    var attributes = params.attributes;
    if ( attributes )
    {
        if ( attributes.framework )
            framework = attributes.framework;

        if ( attributes.extension )
            extension = attributes.extension;

        if ( attributes.namespace )
            _namespace = attributes.namespace;
    }

    // Calculate the target file name (<source.xxx => <source>.d.ts)
    var targetFile = sourceFile;
    var lastDotAt = targetFile.lastIndexOf( "." );
    if ( lastDotAt >= 0 )
        targetFile = targetFile.substr( 0, lastDotAt) + extension;

    // Load the metadata:
    var metadataStore = new breeze.MetadataStore();
    metadataStore.importMetadata( metadata );

    // Generate the type definitions:
    var typedefs = Generate( metadataStore, _namespace, framework );

    // Build the result:
    var result = {};
    result.filename = targetFile;
    result.contents = typedefs;

    // Return
    callback( null, [result] );
};

function Generate( metadataStore, declareModule, format )
{

    function generateTypeDefinition( type, format )
    {
        var crlf = String.fromCharCode( 13 );
        var html = '';
        html += 'export interface ' + type.shortName;

        // base type
        html += ' extends ';
        if ( type.hasOwnProperty( 'baseEntityType' ) )
        {
            html += type.baseEntityType.shortName;
        } else
        {
            html += 'breeze.Entity';
        }
        html += ' {' + crlf;

        // data properties
        for ( j = 0; j < type.dataProperties.length; j++ )
        {
            property = type.dataProperties[j];
            if ( type.baseEntityType && type.baseEntityType.dataProperties.filter( function ( p ) { return p.name === property.name; } ).length > 0 )
                continue;
            html += generateDataPropertyDefinition( property, format );
        }

        // navigation properties
        for ( j = 0; j < type.navigationProperties.length; j++ )
        {
            property = type.navigationProperties[j];
            if ( type.baseEntityType && type.baseEntityType.navigationProperties.filter( function ( p ) { return p.name === property.name; } ).length > 0 )
                continue;
            html += generateNavigationPropertyDefinition( property, format );
        }

        html += '}' + crlf + crlf;

        return html;
    }

    function generateDataPropertyDefinition( property, format )
    {
        if ( format.toUpperCase() === 'KNOCKOUT' )
            return generateDataPropertyDefinitionKO( property );
        else
            return generateDataPropertyDefinitionPOTSO( property );
    }

    function generateDataPropertyDefinitionKO( property )
    {
        var crlf = String.fromCharCode( 13 );
        var propertyDef = '';
        propertyDef += '    ' + property.name;
        //if (property.isNullable)
        //    propertyDef += '?';
        propertyDef += ': KnockoutObservable&lt;';
        propertyDef += getJSType( property.dataType.name );
        propertyDef += '&gt;; //' + property.dataType.name + crlf;

        return propertyDef;
    }

    function generateDataPropertyDefinitionPOTSO( property )
    {
        var crlf = String.fromCharCode( 13 );
        var propertyDef = '';
        propertyDef += '    ' + property.name;
        //if (property.isNullable)
        //    propertyDef += '?';
        propertyDef += ': ';
        propertyDef += getJSType( property.dataType.name );
        propertyDef += '; //' + property.dataType.name + crlf;

        return propertyDef;
    }

    function generateNavigationPropertyDefinition( property, format )
    {
        if ( format.toUpperCase() === 'KNOCKOUT')
            return generateNavigationPropertyDefinitionKO( property );
        else
            return generateNavigationPropertyDefinitionPOTSO( property );
    }

    function generateNavigationPropertyDefinitionKO( property )
    {
        var crlf = String.fromCharCode( 13 );
        var propertyDef = '';
        propertyDef += '    ' + property.name;
        //if (property.isNullable)
        //    html += '?';
        if ( property.isScalar )
            propertyDef += ': KnockoutObservable&lt;';
        else
            propertyDef += ': KnockoutObservableArray&lt;';
        propertyDef += property.entityType.shortName;
        propertyDef += '&gt;;' + crlf;

        return propertyDef;
    }

    function generateNavigationPropertyDefinitionPOTSO( property )
    {
        var crlf = String.fromCharCode( 13 );
        var propertyDef = '';
        propertyDef += '    ' + property.name;
        //if (property.isNullable)
        //    html += '?';
        if ( property.isScalar )
            propertyDef += ': ' + property.entityType.shortName + ';';
        else
            propertyDef += ': ' + property.entityType.shortName + '[];';
        propertyDef += crlf;

        return propertyDef;
    }

    function getJSType( metadataType )
    {
        if ( /(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test( metadataType ) )
            return 'number';
        else if ( /(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test( metadataType ) )
            return 'Date';
        else if ( /(Boolean)/i.test( metadataType ) )
            return 'boolean';
        return 'string';
    }

    var crlf = String.fromCharCode( 13 );
    var prefix = "";
    var typedefs = "";
    var suffix = "";

    if ( declareModule )
    {
        prefix = 'declare module ' + declareModule + ' {' + crlf;
        suffix = crlf + '}';
    }

    var types = metadataStore.getEntityTypes();
    for ( i = 0; i < types.length; i++ )
    {
        // type declaration
        var type = types[i];
        typedefs += generateTypeDefinition( type, format );
    }

    return prefix + typedefs + suffix;
}

//return function (data, callback) {
//    var result = 'Node.js welcomes ' + data;
//    callback(null, result);
//}
