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
    var attributes = params.attributes;
    var url = params.url;

    var framework = "none";
    var extension = ".d.ts";
    var _namespace = null;
    var proxyname = null;
    var generateTypedQueries = false;
    if ( attributes )
    {
        if ( attributes.framework )
            framework = attributes.framework;

        if ( attributes.extension )
            extension = attributes.extension;

        if ( attributes.namespace )
            _namespace = attributes.namespace;

        if ( attributes.proxyname )
        {
            proxyname = attributes.proxyname;

            if ( attributes.generateTypedQueries )
                generateTypedQueries = attributes.generateTypedQueries;
        }
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
    var typedefs = GenerateTypedefs( metadataStore, _namespace, framework, generateTypedQueries );

    // Build the result:
    var result = [];
    result.push( {'filename': targetFile, 'contents': typedefs} );

    if ( proxyname )
    {
        var proxyfile = sourceFile;
        var lastSlashAt = proxyfile.lastIndexOf( "\\" );
        if ( lastSlashAt >= 0 )
            proxyfile = proxyfile.substr( 0, lastSlashAt ) + '\\' + proxyname + '.ts';

        var proxydef = GenerateProxy( proxyname, JSON.parse( metadata ), metadataStore, _namespace, framework, generateTypedQueries, url );

        if ( generateTypedQueries )
        {
            proxydef += GenerateMetadata( metadataStore, _namespace );
        }

        result.push( { 'filename': proxyfile, 'contents': proxydef } );
    }

    // Return
    callback( null, result );
};

function GenerateTypedefs( metadataStore, declareModule, format, generateTypedQueries )
{
    function generateTypeDefinition( type, format )
    {
        var crlf = String.fromCharCode( 13 );
        var html = '';
        html += '   export interface ' + type.shortName;

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

        html += '   }' + crlf + crlf;

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
        propertyDef += '      ' + property.name;
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
        propertyDef += '      ' + property.name;
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
        prefix += 'declare module ' + declareModule + '.typedefs' + crlf;
        prefix += '{' + crlf;
        suffix += '}' + crlf;
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

function GenerateProxy( proxyname, metadatajson, metadataStore, namespace, format, generateTypedQueries, url )
{
    var crlf = String.fromCharCode( 13 );
    var prefix = "";
    var typedefs = "";
    var suffix = "";

    if ( namespace )
    {
        prefix += '/// <reference path="breezeextensions.ts" />' + crlf;
        prefix += 'namespace ' + namespace + crlf;
        prefix += '{' + crlf;
        prefix += '   import extensions = dk.schaumburgit.breezeextensions;' + crlf;
        prefix += '   import typedefs = ' + namespace + '.typedefs;' + crlf;
        prefix += '   import querybuilder = ' + namespace + '.querybuilder;' + crlf;
        prefix += '   export class ' + proxyname + crlf;
        prefix += '   {' + crlf;
        prefix += '      private _entityManager: breeze.EntityManager = null;' + crlf;        prefix += '      constructor(serverUrl: string);' + crlf;        prefix += '      constructor(breezeManager: breeze.EntityManager);' + crlf;        prefix += '      constructor(server: string | breeze.EntityManager = null)' + crlf;        prefix += '      {' + crlf;        prefix += '          if (server == null)' + crlf;        prefix += '          {' + crlf;        if ( !!url )
        {
            prefix += '              this._entityManager = new breeze.EntityManager("' + url + '");' + crlf;
        }        else
        {
            prefix += '              throw "Cannot use a null or empty URL when connecting to a ' + proxyname + ' data service";' + crlf;
        }        prefix += '          }' + crlf;        prefix += '          else if (typeof server === "string")' + crlf;        prefix += '          {' + crlf;        prefix += '              this._entityManager = new breeze.EntityManager(server as string);' + crlf;        prefix += '          }' + crlf;        prefix += '          else' + crlf;        prefix += '          {' + crlf;        prefix += '              this._entityManager = server as breeze.EntityManager;' + crlf;        prefix += '          }' + crlf;        prefix += '      }' + crlf;        suffix += '   }' + crlf;
        suffix += '}' + crlf;
    }

    var entities = metadatajson.schema.entityContainer.entitySet;
    for ( i = 0; i < entities.length; i++ )
    {
        // type declaration
        var entity = entities[i];
        typedefs += generateEntityMethod( entity, format, generateTypedQueries );
    }

    return prefix + typedefs + suffix;

    function generateEntityMethod( entity, format, generateTypedQueries )
    {
        var entityName = entity.name;
        var propName = entity.name;
        var propType = tsTypeName( entity.entityType );
        var metaType = tsMetaTypeName( entity.entityType );
        var methoddef = "";
        if ( generateTypedQueries )
        {
            methoddef += '      public get ' + propName + '(): extensions.TEntityQuery<' + metaType + ', ' + propType + '>' + crlf;
            methoddef += '      {' + crlf;
            methoddef += '          return new extensions.TEntityQuery<' + metaType + ', ' + propType + '>(this._entityManager, "' + entityName + '", ' + metaType + '._Instance, null, null);' + crlf;
            methoddef += '      }' + crlf;
        }
        else
        {
            methoddef += '      public get ' + propName + '(): breeze.EntityQuery' + crlf;
            methoddef += '      {' + crlf;
            methoddef += '          return breeze.EntityQuery.from("' + propName + '");' + crlf;
            methoddef += '      }' + crlf;
        }

        return methoddef;
    }

    function tsTypeName( breezeTypeName )
    {
        return 'typedefs.' + breezeTypeName.replace( 'Self.', '' );
    }

    function tsMetaTypeName( breezeTypeName )
    {
        return 'querybuilder.' + breezeTypeName.replace( 'Self.', '' ) + 'Query';
    }
}

function GenerateMetadata( metadataStore, namespace)
{
    function getJSTypeInfo( metadataType )
    {
        if ( /(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test( metadataType ) )
            return 'NumberFieldInfo';
        else if ( /(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test( metadataType ) )
            return 'DateFieldInfo';
        else if ( /(Boolean)/i.test( metadataType ) )
            return 'BooleanFieldInfo';
        return 'StringFieldInfo';
    }

    function getMetadataclassName( type )
    {
        return type.shortName + 'Query'
    }

    function primitiveInfoName(containingType, primitiveType )
    {
        var thisMeta = getMetadataclassName( containingType );
        var thisEntity = 'typedefs.' + containingType.shortName;
        var primitive = 'extensions.' + getJSTypeInfo( primitiveType.name ); //NumberFieldInfo
        return primitive + '<' + thisMeta + ', ' + thisEntity  + '>'; // extensions.NumberFieldInfo<OrderType, Order>
    }

    function generateTypeMetadata( type )
    {
        var crlf = String.fromCharCode( 13 );
        var metadata = '';
        var metadataclassName = getMetadataclassName( type );
        metadata += '   export class ' + metadataclassName + crlf;
        metadata += '   {' + crlf;
        metadata += '      private static _instance: ' + metadataclassName + ' = null;' + crlf;
        metadata += '      static get _Instance(): ' + metadataclassName + ' {' + crlf;
        metadata += '          if (' + metadataclassName + '._instance == null)' + crlf;
        metadata += '              ' + metadataclassName + '._instance = new ' + metadataclassName + '();' + crlf;
        metadata += '          return ' + metadataclassName + '._instance;' + crlf;
        metadata += '      }' + crlf;

        // data properties
        for ( j = 0; j < type.dataProperties.length; j++ )
        {
            property = type.dataProperties[j];
            if ( type.baseEntityType && type.baseEntityType.dataProperties.filter( function ( p ) { return p.name === property.name; } ).length > 0 )
                continue;
            metadata += generateDataPropertyMetadata( type, property );
        }

        // navigation properties
        for ( j = 0; j < type.navigationProperties.length; j++ )
        {
            property = type.navigationProperties[j];
            if ( type.baseEntityType && type.baseEntityType.navigationProperties.filter( function ( p ) { return p.name === property.name; } ).length > 0 )
                continue;
            metadata += generateNavigationPropertyMetadata( type, property );
        }

        metadata += '   }' + crlf + crlf;

        return metadata;
    }

    function generateDataPropertyMetadata(type, property )
    {
        var crlf = String.fromCharCode( 13 );
        var thisMeta = getMetadataclassName( type );
        var metadataDef = '';
        propertyinfoName = primitiveInfoName( type, property.dataType );

        metadataDef += '      public ' + property.name + ': ' + propertyinfoName + ' = new ' + propertyinfoName + '(' + thisMeta + '._instance, "' + property.name + '"); ' + crlf;

        return metadataDef;
    }

    function generateNavigationPropertyMetadata( type, property )
    {
        var crlf = String.fromCharCode( 13 );
        var thisMeta = getMetadataclassName( type );
        var thisEntity = 'typedefs.' + type.shortName;

        var otherMeta = getMetadataclassName( property.entityType );
        var otherEntity = 'typedefs.' + property.entityType.shortName

        propertyinfoName = 'extensions.MultiAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';
        if ( property.isScalar )
            propertyinfoName = 'extensions.SingleAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';

        var metadataDef = '      public ' + property.name + ': ';

        metadataDef += propertyinfoName + ' = new ' + propertyinfoName + '(' + thisMeta + '._instance, "' + property.name + '");' + crlf;

        return metadataDef;
    }

    var crlf = String.fromCharCode( 13 );
    var prefix = "";
    var typedefs = "";
    var suffix = "";

    if ( namespace )
    {
        prefix += 'namespace ' + namespace + '.querybuilder' + crlf;
        prefix += '{' + crlf;
        prefix += '   import extensions = dk.schaumburgit.breezeextensions;' + crlf;
        prefix += '   import typedefs = ' + namespace + '.typedefs;' + crlf;
        suffix += crlf + '}';
    }

    var types = metadataStore.getEntityTypes();
    for ( i = 0; i < types.length; i++ )
    {
        // type declaration
        var type = types[i];
        typedefs += generateTypeMetadata( type );
    }

    return prefix + typedefs + suffix;
}

//return function (data, callback) {
//    var result = 'Node.js welcomes ' + data;
//    callback(null, result);
//}
