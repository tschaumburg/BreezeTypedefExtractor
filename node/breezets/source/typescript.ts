/////<reference path='../typings/index.d.ts' />

//export function generateTypescript(refname: string, metadata: string, url: string, _namespace: string, proxyname: string, generateTypedQueries: boolean, extensions: boolean, attributes: {}): [{ filename: string, contents: string }]
//{
//    return breezeref._generateTypescript(refname, metadata, url, _namespace, proxyname, generateTypedQueries, extensions, attributes);
//}

//namespace breezeref
//{
//    //require('./js/jquery-2.1.0.js');
//    var breeze = require('breeze-client');

//    function requiretext(filename: string)
//    {
//        var fs = require("fs");
//        var filename = require.resolve(filename);
//        return fs.readFileSync(filename, 'utf8');
//    }

//    export function _generateTypescript(refname: string, metadata: string, url: string, _namespace: string, proxyname: string, generateTypedQueries: boolean, extensions: boolean, attributes: {}): [{ filename: string, contents: string }]
//    {
//        var framework = "none";
//        var extension = ".d.ts";
//        if (attributes)
//        {
//            if (attributes["framework"])
//                framework = attributes["framework"];

//            if (attributes["extension"])
//                extension = attributes["extension"];
//        }

//        // Calculate the target file name (<source.xxx => <source>.d.ts)
//        //var targetFile = sourceFile;
//        //var lastDotAt = targetFile.lastIndexOf( "." );
//        //if ( lastDotAt >= 0 )
//        //    targetFile = targetFile.substr(0, lastDotAt) + extension;
//        var targetFile = refname + extension;

//        // Load the metadata:
//        var metadataStore = new breeze.MetadataStore();
//        metadataStore.importMetadata(metadata);

//        AnnotateMetadata(metadataStore, _namespace, framework, generateTypedQueries);

//        // Generate the type definitions:
//        var typedefs = GenerateTypedefs(metadataStore, _namespace, framework, generateTypedQueries);

//        // Build the result:
//        var result: [{ filename: string, contents: string }] = <[{ filename: string, contents: string }]>[];
//        result.push({ filename: targetFile, contents: typedefs });

//        if (proxyname)
//        {
//            //var proxyfile = sourceFile;
//            //var lastSlashAt = proxyfile.lastIndexOf( "\\" );
//            //if ( lastSlashAt >= 0 )
//            //    proxyfile = proxyfile.substr( 0, lastSlashAt ) + '\\' + proxyname + '.ts';
//            var proxyfile = refname + ".ts";

//            var proxydef = GenerateProxy(proxyname, JSON.parse(metadata), metadataStore, _namespace, framework, generateTypedQueries, url);

//            if (generateTypedQueries)
//            {
//                proxydef += GenerateMetadata(metadataStore, _namespace);
//            }

//            result.push({ filename: proxyfile, contents: proxydef });
//        }

//        if (proxyname && generateTypedQueries && extensions)
//            result.push({ filename: "breezeextensions.ts", contents: requiretext("../lib/breezeextensions.ts") });

//        return result;
//    };

//    function AnnotateMetadata(metadataStore, namespace, format, generateTypedQueries)
//    {
//        var types = metadataStore.getEntityTypes();
//        for (var i = 0; i < types.length; i++)
//        {
//            // type declaration
//            var type = types[i];
//            annotateTypeDefinition(type, format);
//        }

//        function annotateTypeDefinition(type, format)
//        {
//            type.btg = {};
//            type.btg.className = type.shortName;
//            type.btg.metadataName = type.shortName + 'Query';
//            //type.btg.classReference = 'typedef.' + type.shortName;

//            // data properties
//            for (var j = 0; j < type.dataProperties.length; j++)
//            {
//                var property = type.dataProperties[j];
//                property.btg = {};
//                property.btg.propertyName = property.name;
//                property.dataType.btg = {};
//                property.dataType.btg.typeReference = getJSType(property.dataType.name);
//                property.dataType.btg.metadataName = getJSTypeInfo(property.dataType.name);
//            }

//            // navigation properties
//            for (var j = 0; j < type.navigationProperties.length; j++)
//            {
//                property = type.navigationProperties[j];
//                property.btg = {};
//                property.btg.propertyName = property.name;
//            }
//        }

//        function getJSType(metadataType)
//        {
//            if (/(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test(metadataType))
//                return 'number';
//            else if (/(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test(metadataType))
//                return 'Date';
//            else if (/(Boolean)/i.test(metadataType))
//                return 'boolean';
//            return 'string';
//        }

//        function getJSTypeInfo(metadataType)
//        {
//            if (/(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test(metadataType))
//                return 'NumberFieldInfo';
//            else if (/(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test(metadataType))
//                return 'DateFieldInfo';
//            else if (/(Boolean)/i.test(metadataType))
//                return 'BooleanFieldInfo';
//            return 'StringFieldInfo';
//        }
//    }

//    function GenerateTypedefs(metadataStore, declareModule, format, generateTypedQueries)
//    {
//        var crlf = String.fromCharCode(13);
//        var prefix = "";
//        var typedefs = "";
//        var suffix = "";

//        if (declareModule)
//        {
//            prefix += 'declare module ' + declareModule + '.typedefs' + crlf;
//            prefix += '{' + crlf;
//            suffix += '}' + crlf;
//        }

//        var types = metadataStore.getEntityTypes();
//        for (var i = 0; i < types.length; i++)
//        {
//            // type declaration
//            var type = types[i];
//            typedefs += generateTypeDefinition(type, format);
//        }

//        return prefix + typedefs + suffix;

//        function generateTypeDefinition(type, format)
//        {
//            var crlf = String.fromCharCode(13);
//            var html = '';
//            html += '   export interface ' + type.btg.className;

//            // base type
//            html += ' extends ';
//            if (type.hasOwnProperty('baseEntityType'))
//            {
//                html += type.baseEntityType.btg.className;
//            } else
//            {
//                html += 'breeze.Entity';
//            }
//            html += ' {' + crlf;

//            // data properties
//            for (j = 0; j < type.dataProperties.length; j++)
//            {
//                var property = type.dataProperties[j];
//                if (type.baseEntityType && type.baseEntityType.dataProperties.filter(function (p) { return p.name === property.name; }).length > 0)
//                    continue;
//                html += generateDataPropertyDefinition(property, format);
//            }

//            // navigation properties
//            for (var j = 0; j < type.navigationProperties.length; j++)
//            {
//                var property = type.navigationProperties[j];
//                if (type.baseEntityType && type.baseEntityType.navigationProperties.filter(function (p) { return p.name === property.name; }).length > 0)
//                    continue;
//                html += generateNavigationPropertyDefinition(property, format);
//            }

//            html += '   }' + crlf + crlf;

//            return html;
//        }

//        function generateDataPropertyDefinition(property, format)
//        {
//            if (format.toUpperCase() === 'KNOCKOUT')
//                return generateDataPropertyDefinitionKO(property);
//            else
//                return generateDataPropertyDefinitionPOTSO(property);
//        }

//        function generateDataPropertyDefinitionKO(property)
//        {
//            var crlf = String.fromCharCode(13);
//            var propertyDef = '';
//            propertyDef += '    ' + property.name;
//            //if (property.isNullable)
//            //    propertyDef += '?';
//            propertyDef += ': KnockoutObservable&lt;';
//            propertyDef += property.dataType.btg.typeReference;
//            propertyDef += '&gt;; //' + property.dataType.name + crlf;

//            return propertyDef;
//        }

//        function generateDataPropertyDefinitionPOTSO(property)
//        {
//            //var crlf = String.fromCharCode( 13 );
//            var propertyDef = '';
//            propertyDef += '      ' + property.btg.propertyName + ': ' + property.dataType.btg.typeReference;
//            propertyDef += ';' + crlf;

//            return propertyDef;
//        }

//        function generateNavigationPropertyDefinition(property, format)
//        {
//            if (format.toUpperCase() === 'KNOCKOUT')
//                return generateNavigationPropertyDefinitionKO(property);
//            else
//                return generateNavigationPropertyDefinitionPOTSO(property);
//        }

//        function generateNavigationPropertyDefinitionKO(property)
//        {
//            var crlf = String.fromCharCode(13);
//            var propertyDef = '';
//            propertyDef += '    ' + property.name;
//            //if (property.isNullable)
//            //    html += '?';
//            if (property.isScalar)
//                propertyDef += ': KnockoutObservable&lt;';
//            else
//                propertyDef += ': KnockoutObservableArray&lt;';
//            propertyDef += property.entityType.shortName;
//            propertyDef += '&gt;;' + crlf;

//            return propertyDef;
//        }

//        function generateNavigationPropertyDefinitionPOTSO(property)
//        {
//            //var crlf = String.fromCharCode( 13 );
//            var propertyDef = '      ' + property.btg.propertyName + ': ' + property.entityType.btg.className;
//            if (!property.isScalar)
//                propertyDef += '[]';
//            propertyDef += ';' + crlf;

//            return propertyDef;
//        }
//    }

//    function GenerateProxy(proxyname, metadatajson, metadataStore, namespace, format, generateTypedQueries, url)
//    {
//        var crlf = String.fromCharCode(13);
//        var prefix = "";
//        var typedefs = "";
//        var suffix = "";

//        if (generateTypedQueries)
//        {
//            prefix += '/// <reference path="breezeextensions.ts" />' + crlf;
//        }

//        if (namespace)
//        {
//            prefix += 'namespace ' + namespace + crlf;
//            prefix += '{' + crlf;

//            suffix += '}' + crlf;
//        }

//        if (generateTypedQueries)
//        {
//            prefix += '   import extensions = dk.schaumburgit.breezeextensions;' + crlf;
//            prefix += '   import typedefs = ' + namespace + '.typedefs;' + crlf;
//            prefix += '   import querybuilder = ' + namespace + '.querybuilder;' + crlf;
//        }

//        prefix += '   export class ' + proxyname + crlf;
//        prefix += '   {' + crlf;
//        suffix = '   }' + crlf + suffix;

//        typedefs += generateConstructor(proxyname);

//        var entities = metadatajson.schema.entityContainer.entitySet;
//        for (var i = 0; i < entities.length; i++)
//        {
//            // type declaration
//            var entity = entities[i];
//            typedefs += generateEntityMethod(entity, format, generateTypedQueries);
//        }

//        return prefix + typedefs + suffix;

//        function generateConstructor(proxyname)
//        {
//            var ctor = "";
//            ctor += '      private _entityManager: breeze.EntityManager = null;' + crlf;
//            ctor += '      constructor(serverUrl: string);' + crlf;
//            ctor += '      constructor(breezeManager: breeze.EntityManager);' + crlf;
//            ctor += '      constructor(server: string | breeze.EntityManager = null)' + crlf;
//            ctor += '      {' + crlf;
//            ctor += '          if (server == null)' + crlf;
//            ctor += '          {' + crlf;
//            if (!!url)
//            {
//                ctor += '              this._entityManager = new breeze.EntityManager("' + url + '");' + crlf;
//            }
//            else
//            {
//                ctor += '              throw "Cannot use a null or empty URL when connecting to a ' + proxyname + ' data service";' + crlf;
//            }
//            ctor += '          }' + crlf;
//            ctor += '          else if (typeof server === "string")' + crlf;
//            ctor += '          {' + crlf;
//            ctor += '              this._entityManager = new breeze.EntityManager(server as string);' + crlf;
//            ctor += '          }' + crlf;
//            ctor += '          else' + crlf;
//            ctor += '          {' + crlf;
//            ctor += '              this._entityManager = server as breeze.EntityManager;' + crlf;
//            ctor += '          }' + crlf;
//            ctor += '      }' + crlf;

//            return ctor;
//        }

//        function generateEntityMethod(entity, format, generateTypedQueries)
//        {
//            var entityName = entity.name;
//            var propName = entity.name;
//            var propType = tsTypeName(entity.entityType);
//            var metaType = tsMetaTypeName(entity.entityType);
//            var methoddef = "";
//            if (generateTypedQueries)
//            {
//                methoddef += '      public get ' + propName + '(): extensions.TEntityQuery<' + metaType + ', ' + propType + '>' + crlf;
//                methoddef += '      {' + crlf;
//                methoddef += '          return new extensions.TEntityQuery<' + metaType + ', ' + propType + '>(this._entityManager, "' + entityName + '", ' + metaType + '._Instance, null, null);' + crlf;
//                methoddef += '      }' + crlf;
//            }
//            else
//            {
//                methoddef += '      public get ' + propName + '(): breeze.EntityQuery' + crlf;
//                methoddef += '      {' + crlf;
//                methoddef += '          return breeze.EntityQuery.from("' + propName + '");' + crlf;
//                methoddef += '      }' + crlf;
//            }

//            return methoddef;
//        }

//        function tsTypeName(breezeTypeName)
//        {
//            return 'typedefs.' + breezeTypeName.replace('Self.', '');
//        }

//        function tsMetaTypeName(breezeTypeName)
//        {
//            return 'querybuilder.' + breezeTypeName.replace('Self.', '') + 'Query';
//        }
//    }

//    function GenerateMetadata(metadataStore, namespace)
//    {
//        function primitiveInfoName(containingType, primitiveType)
//        {
//            var thisEntity = 'typedefs.' + containingType.btg.className;
//            return 'extensions.' + primitiveType.btg.metadataName + '<' + containingType.btg.metadataName + ', ' + thisEntity + '>'; // extensions.NumberFieldInfo<OrderType, Order>
//        }

//        function generateTypeMetadata(type)
//        {
//            //var crlf = String.fromCharCode( 13 );
//            var metadataclassName = type.btg.metadataName;
//            var metadata = '';
//            metadata += '   export class ' + metadataclassName + crlf;
//            metadata += '   {' + crlf;
//            metadata += '      private static _instance: ' + metadataclassName + ' = null;' + crlf;
//            metadata += '      static get _Instance(): ' + metadataclassName + ' {' + crlf;
//            metadata += '          if (' + metadataclassName + '._instance == null)' + crlf;
//            metadata += '              ' + metadataclassName + '._instance = new ' + metadataclassName + '();' + crlf;
//            metadata += '          return ' + metadataclassName + '._instance;' + crlf;
//            metadata += '      }' + crlf;

//            // data properties
//            for (var j = 0; j < type.dataProperties.length; j++)
//            {
//                var property = type.dataProperties[j];
//                if (type.baseEntityType && type.baseEntityType.dataProperties.filter(function (p) { return p.name === property.name; }).length > 0)
//                    continue;
//                metadata += generateDataPropertyMetadata(type, property);
//            }

//            // navigation properties
//            for (j = 0; j < type.navigationProperties.length; j++)
//            {
//                var property = type.navigationProperties[j];
//                if (type.baseEntityType && type.baseEntityType.navigationProperties.filter(function (p) { return p.name === property.name; }).length > 0)
//                    continue;
//                metadata += generateNavigationPropertyMetadata(type, property);
//            }

//            metadata += '   }' + crlf + crlf;

//            return metadata;
//        }

//        function generateDataPropertyMetadata(type, property)
//        {
//            var crlf = String.fromCharCode(13);
//            var thisMeta = type.btg.metadataName;
//            var metadataDef = '';
//            var propertyinfoName = primitiveInfoName(type, property.dataType);

//            metadataDef += '      public ' + property.name + ': ' + propertyinfoName;
//            metadataDef += ' = new ' + propertyinfoName + '(' + thisMeta + '._instance, "' + property.name + '"); ' + crlf;

//            return metadataDef;
//        }

//        function generateNavigationPropertyMetadata(type, property)
//        {
//            var crlf = String.fromCharCode(13);
//            var thisMeta = type.btg.metadataName;
//            var thisEntity = 'typedefs.' + type.shortName;

//            var otherMeta = property.entityType.btg.metadataName;
//            var otherEntity = 'typedefs.' + property.entityType.shortName

//            var propertyinfoName = 'extensions.MultiAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';
//            if (property.isScalar)
//                propertyinfoName = 'extensions.SingleAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';

//            var metadataDef = '      public ' + property.name + ': ';

//            metadataDef += propertyinfoName + ' = new ' + propertyinfoName + '(' + thisMeta + '._instance, "' + property.name + '");' + crlf;

//            return metadataDef;
//        }

//        var crlf = String.fromCharCode(13);
//        var prefix = "";
//        var typedefs = "";
//        var suffix = "";

//        if (namespace)
//        {
//            prefix += 'namespace ' + namespace + '.querybuilder' + crlf;
//            prefix += '{' + crlf;
//            prefix += '   import extensions = dk.schaumburgit.breezeextensions;' + crlf;
//            prefix += '   import typedefs = ' + namespace + '.typedefs;' + crlf;
//            suffix += crlf + '}';
//        }

//        var types = metadataStore.getEntityTypes();
//        for (var i = 0; i < types.length; i++)
//        {
//            // type declaration
//            var type = types[i];
//            typedefs += generateTypeMetadata(type);
//        }

//        return prefix + typedefs + suffix;
//    }

//    //return function (data, callback) {
//    //    var result = 'Node.js welcomes ' + data;
//    //    callback(null, result);
//    //}
//}