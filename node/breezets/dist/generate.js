"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//require('./js/jquery-2.1.0.js');
//var breeze = require('breeze-client');
var fs = require('fs');
var http = require('http');
var breeze = require("breeze-client");
function generateTypescript(metadata, url, proxyname, attributes) {
    return breezeref._generateTypescript(metadata, url, proxyname, attributes);
}
exports.generateTypescript = generateTypescript;
function getMetadata(url, cached) {
    if (!url)
        return cached;
    try {
        return breezeref.getMetadata1(url);
    }
    catch (err) {
        // warn that we are falling back to the cache
        return cached;
    }
}
exports.getMetadata = getMetadata;
var breezeref;
(function (breezeref) {
    function getMetadata1(urlstr) {
        var url = require("url");
        var u = url.parse(urlstr);
        if (u.protocol == null || u.protocol.toLowerCase() === 'file' || u.protocol.toLowerCase() === 'file:') {
            var filename = u.pathname;
            return fs.readFileSync(filename, 'utf8');
        }
        else {
            var request = require('sync-request');
            var res = request('GET', urlstr);
            var metadata = res.getBody('utf8');
            return metadata;
        }
    }
    breezeref.getMetadata1 = getMetadata1;
    function requiretext(filename) {
        var fs = require("fs");
        var filename = require.resolve(filename);
        return fs.readFileSync(filename, 'utf8');
    }
    function _generateTypescript(metadata, url, proxyname, attributes) {
        var crlf = String.fromCharCode(13);
        var result = [];
        var framework = "none";
        //var extension = ".d.ts";
        var filename = proxyname.toLowerCase();
        if (attributes) {
            if (attributes["framework"])
                framework = attributes["framework"];
            //if (attributes["extension"])
            //    extension = attributes["extension"];
        }
        // Load the metadata:
        var metadataStore = new breeze.MetadataStore();
        metadataStore.importMetadata(metadata);
        AnnotateMetadata(metadataStore, framework);
        var index = "";
        // Generate the type definitions:
        var typedefsFile = "typedefs.ts";
        var typedefs = GenerateTypedefs(metadataStore, framework);
        result.push({ filename: typedefsFile, contents: typedefs });
        index += 'export * from "./typedefs";' + crlf;
        if (proxyname) {
            var proxyfile = (filename + ".ts").toLowerCase();
            var proxydef = GenerateProxy(proxyname, JSON.parse(metadata), metadataStore, framework, url);
            result.push({ filename: proxyfile, contents: proxydef });
            index += 'export * from "./' + filename + '";' + crlf;
            {
                var querybuilderFile = "querybuilder.ts";
                var querybuilder = GenerateMetadata(metadataStore);
                result.push({ filename: querybuilderFile, contents: querybuilder });
                index += 'export * from "./querybuilder";' + crlf;
            }
        }
        //if (proxyname && generateTypedQueries && extensions)
        //    result.push({ filename: "breezeextensions.js", contents: requiretext("./breezeextensions.js") });
        //index += 'var breezets = require("breezets");' + crlf;
        result.push({ filename: "index.ts", contents: index });
        return result;
    }
    breezeref._generateTypescript = _generateTypescript;
    ;
    function AnnotateMetadata(metadataStore, format) {
        var types = metadataStore.getEntityTypes();
        for (var i = 0; i < types.length; i++) {
            // type declaration
            var type = types[i];
            annotateTypeDefinition(type, format);
        }
        function annotateTypeDefinition(type, format) {
            type.btg = {};
            type.btg.className = type.shortName;
            type.btg.metadataName = type.shortName + 'Query';
            //type.btg.classReference = 'typedef.' + type.shortName;
            // data properties
            for (var j = 0; j < type.dataProperties.length; j++) {
                var property = type.dataProperties[j];
                property.btg = {};
                property.btg.propertyName = property.name;
                property.dataType.btg = {};
                property.dataType.btg.typeReference = getJSType(property.dataType.name);
                property.dataType.btg.metadataName = getJSTypeInfo(property.dataType.name);
            }
            // navigation properties
            for (var j = 0; j < type.navigationProperties.length; j++) {
                property = type.navigationProperties[j];
                property.btg = {};
                property.btg.propertyName = property.name;
            }
        }
        function getJSType(metadataType) {
            if (/(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test(metadataType))
                return 'number';
            else if (/(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test(metadataType))
                return 'Date';
            else if (/(Boolean)/i.test(metadataType))
                return 'boolean';
            return 'string';
        }
        function getJSTypeInfo(metadataType) {
            if (/(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test(metadataType))
                return 'NumberFieldInfo';
            else if (/(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test(metadataType))
                return 'DateFieldInfo';
            else if (/(Boolean)/i.test(metadataType))
                return 'BooleanFieldInfo';
            return 'StringFieldInfo';
        }
    }
    function GenerateTypedefs(metadataStore, format) {
        var crlf = String.fromCharCode(13);
        var prefix = "";
        var typedefs = "";
        var suffix = "";
        prefix += 'import breeze = require("breeze-client");';
        prefix += crlf;
        prefix += crlf;
        var types = metadataStore.getEntityTypes();
        for (var i = 0; i < types.length; i++) {
            // type declaration
            var type = types[i];
            typedefs += generateTypeDefinition(type, format);
        }
        return prefix + typedefs + suffix;
        function generateTypeDefinition(type, format) {
            var crlf = String.fromCharCode(13);
            var html = '';
            html += '   export interface ' + type.btg.className;
            // base type
            html += ' extends ';
            if (type.hasOwnProperty('baseEntityType')) {
                html += type.baseEntityType.btg.className;
            }
            else {
                html += 'breeze.Entity';
            }
            html += ' {' + crlf;
            // data properties
            for (j = 0; j < type.dataProperties.length; j++) {
                var property = type.dataProperties[j];
                if (type.baseEntityType && type.baseEntityType.dataProperties.filter(function (p) { return p.name === property.name; }).length > 0)
                    continue;
                html += generateDataPropertyDefinition(property, format);
            }
            // navigation properties
            for (var j = 0; j < type.navigationProperties.length; j++) {
                var property = type.navigationProperties[j];
                if (type.baseEntityType && type.baseEntityType.navigationProperties.filter(function (p) { return p.name === property.name; }).length > 0)
                    continue;
                html += generateNavigationPropertyDefinition(property, format);
            }
            html += '   }' + crlf + crlf;
            return html;
        }
        function generateDataPropertyDefinition(property, format) {
            if (format.toUpperCase() === 'KNOCKOUT')
                return generateDataPropertyDefinitionKO(property);
            else
                return generateDataPropertyDefinitionPOTSO(property);
        }
        function generateDataPropertyDefinitionKO(property) {
            var crlf = String.fromCharCode(13);
            var propertyDef = '';
            propertyDef += '    ' + property.name;
            //if (property.isNullable)
            //    propertyDef += '?';
            propertyDef += ': KnockoutObservable&lt;';
            propertyDef += property.dataType.btg.typeReference;
            propertyDef += '&gt;; //' + property.dataType.name + crlf;
            return propertyDef;
        }
        function generateDataPropertyDefinitionPOTSO(property) {
            //var crlf = String.fromCharCode( 13 );
            var propertyDef = '';
            propertyDef += '      ' + property.btg.propertyName + ': ' + property.dataType.btg.typeReference;
            propertyDef += ';' + crlf;
            return propertyDef;
        }
        function generateNavigationPropertyDefinition(property, format) {
            if (format.toUpperCase() === 'KNOCKOUT')
                return generateNavigationPropertyDefinitionKO(property);
            else
                return generateNavigationPropertyDefinitionPOTSO(property);
        }
        function generateNavigationPropertyDefinitionKO(property) {
            var crlf = String.fromCharCode(13);
            var propertyDef = '';
            propertyDef += '    ' + property.name;
            //if (property.isNullable)
            //    html += '?';
            if (property.isScalar)
                propertyDef += ': KnockoutObservable&lt;';
            else
                propertyDef += ': KnockoutObservableArray&lt;';
            propertyDef += property.entityType.shortName;
            propertyDef += '&gt;;' + crlf;
            return propertyDef;
        }
        function generateNavigationPropertyDefinitionPOTSO(property) {
            //var crlf = String.fromCharCode( 13 );
            var propertyDef = '      ' + property.btg.propertyName + ': ' + property.entityType.btg.className;
            if (!property.isScalar)
                propertyDef += '[]';
            propertyDef += ';' + crlf;
            return propertyDef;
        }
    }
    function GenerateProxy(proxyname, metadatajson, metadataStore, format, url) {
        var crlf = String.fromCharCode(13);
        var prefix = "";
        var typedefs = "";
        var suffix = "";
        {
            prefix += '   import * as breeze from "breeze-client";' + crlf;
            prefix += '   import * as extensions from "breezets";' + crlf;
            prefix += '   import * as typedefs from "./typedefs";' + crlf;
            prefix += '   import * as querybuilder from "./querybuilder";' + crlf;
        }
        prefix += '   export class ' + proxyname + crlf;
        prefix += '   {' + crlf;
        suffix = '   }' + crlf + suffix;
        typedefs += generateConstructor(proxyname);
        typedefs += generateSave();
        var entities = metadatajson.schema.entityContainer.entitySet;
        for (var i = 0; i < entities.length; i++) {
            // type declaration
            var entity = entities[i];
            typedefs += generateEntityMethod(entity, format);
        }
        return prefix + typedefs + suffix;
        function generateConstructor(proxyname) {
            var ctor = "";
            ctor += '      private _entityManager: breeze.EntityManager = null;' + crlf;
            ctor += '      constructor(serverUrl: string);' + crlf;
            ctor += '      constructor(breezeManager: breeze.EntityManager);' + crlf;
            ctor += '      constructor(server: string | breeze.EntityManager = null)' + crlf;
            ctor += '      {' + crlf;
            ctor += '          if (server == null)' + crlf;
            ctor += '          {' + crlf;
            if (!!url) {
                ctor += '              this._entityManager = new breeze.EntityManager("' + url + '");' + crlf;
            }
            else {
                ctor += '              throw "Cannot use a null or empty URL when connecting to a ' + proxyname + ' data service";' + crlf;
            }
            ctor += '          }' + crlf;
            ctor += '          else if (typeof server === "string")' + crlf;
            ctor += '          {' + crlf;
            ctor += '              this._entityManager = new breeze.EntityManager(server as string);' + crlf;
            ctor += '          }' + crlf;
            ctor += '          else' + crlf;
            ctor += '          {' + crlf;
            ctor += '              this._entityManager = server as breeze.EntityManager;' + crlf;
            ctor += '          }' + crlf;
            ctor += '      }' + crlf;
            return ctor;
        }
        function generateSave() {
            var save = "";
            save += '      public hasChanges(): boolean' + crlf;
            save += '      {' + crlf;
            save += '          return this._entityManager.hasChanges();' + crlf;
            save += '      }' + crlf;
            save += crlf;
            save += '      public saveChanges(): Promise<breeze.SaveResult>' + crlf;
            save += '      {' + crlf;
            save += '          var promise = this._entityManager.saveChanges();' + crlf;
            save += '          return promise;' + crlf;
            save += '      }' + crlf;
            save += crlf;
            return save;
        }
        function generateEntityMethod(entity, format) {
            var entityName = entity.name;
            var propName = entity.name;
            var propType = tsTypeName(entity.entityType);
            var metaType = tsMetaTypeName(entity.entityType);
            var methoddef = "";
            {
                methoddef += '      public get ' + propName + '(): extensions.TEntitySet<' + metaType + ', ' + propType + '>' + crlf;
                methoddef += '      {' + crlf;
                methoddef += '          return new extensions.TEntitySet<' + metaType + ', ' + propType + '>(' + crlf;
                methoddef += '              this._entityManager, ' + crlf;
                methoddef += '              "' + propType + '", ' + crlf;
                methoddef += '              "' + propName + '", ' + crlf;
                methoddef += '              ' + metaType + '._Instance,' + crlf;
                methoddef += '               null,' + crlf;
                methoddef += '               null);' + crlf;
                methoddef += '      }' + crlf;
            }
            return methoddef;
        }
        function tsTypeName(breezeTypeName) {
            return 'typedefs.' + breezeTypeName.replace('Self.', '');
        }
        function tsMetaTypeName(breezeTypeName) {
            return 'querybuilder.' + breezeTypeName.replace('Self.', '') + 'Query';
        }
    }
    function GenerateMetadata(metadataStore) {
        function primitiveInfoName(containingType, primitiveType) {
            var thisEntity = 'typedefs.' + containingType.btg.className;
            return 'extensions.' + primitiveType.btg.metadataName + '<' + containingType.btg.metadataName + ', ' + thisEntity + '>'; // extensions.NumberFieldInfo<OrderType, Order>
        }
        function generateTypeMetadata(type) {
            //var crlf = String.fromCharCode( 13 );
            var metadataclassName = type.btg.metadataName;
            var metadata = '';
            metadata += '   export class ' + metadataclassName + crlf;
            metadata += '   {' + crlf;
            metadata += '      private static _instance: ' + metadataclassName + ' = null;' + crlf;
            metadata += '      static get _Instance(): ' + metadataclassName + ' {' + crlf;
            metadata += '          if (' + metadataclassName + '._instance == null)' + crlf;
            metadata += '              ' + metadataclassName + '._instance = new ' + metadataclassName + '();' + crlf;
            metadata += '          return ' + metadataclassName + '._instance;' + crlf;
            metadata += '      }' + crlf;
            // data properties
            for (var j = 0; j < type.dataProperties.length; j++) {
                var property = type.dataProperties[j];
                if (type.baseEntityType && type.baseEntityType.dataProperties.filter(function (p) { return p.name === property.name; }).length > 0)
                    continue;
                metadata += generateDataPropertyMetadata(type, property);
            }
            // navigation properties
            for (j = 0; j < type.navigationProperties.length; j++) {
                var property = type.navigationProperties[j];
                if (type.baseEntityType && type.baseEntityType.navigationProperties.filter(function (p) { return p.name === property.name; }).length > 0)
                    continue;
                metadata += generateNavigationPropertyMetadata(type, property);
            }
            metadata += '   }' + crlf + crlf;
            return metadata;
        }
        function generateDataPropertyMetadata(type, property) {
            var crlf = String.fromCharCode(13);
            var thisMeta = type.btg.metadataName;
            var metadataDef = '';
            var propertyinfoName = primitiveInfoName(type, property.dataType);
            metadataDef += '      public ' + property.name + ': ' + propertyinfoName;
            metadataDef += ' = new ' + propertyinfoName + '(' + thisMeta + '._instance, "' + property.name + '"); ' + crlf;
            return metadataDef;
        }
        function generateNavigationPropertyMetadata(type, property) {
            var crlf = String.fromCharCode(13);
            var thisMeta = type.btg.metadataName;
            var thisEntity = 'typedefs.' + type.shortName;
            var otherMeta = property.entityType.btg.metadataName;
            var otherEntity = 'typedefs.' + property.entityType.shortName;
            var propertyinfoName = 'extensions.MultiAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';
            if (property.isScalar)
                propertyinfoName = 'extensions.SingleAssociationFieldInfo<' + thisMeta + ', ' + thisEntity + ', ' + otherMeta + ', ' + otherEntity + '>';
            var ctor = 'new ' + propertyinfoName + '(' + thisMeta + '._Instance, "' + property.name + '", ' + otherMeta + '._Instance' + ')';
            if (property.isScalar)
                ctor = 'new ' + propertyinfoName + '(' + thisMeta + '._Instance, "' + property.name + '")';
            return '      public ' + property.name + ': ' + propertyinfoName + ' = ' + ctor + ';' + crlf;
        }
        var crlf = String.fromCharCode(13);
        var prefix = "";
        var typedefs = "";
        var suffix = "";
        prefix += '   import extensions = require("breezets");' + crlf;
        prefix += '   import typedefs = require("./typedefs");' + crlf;
        prefix += crlf;
        var types = metadataStore.getEntityTypes();
        for (var i = 0; i < types.length; i++) {
            // type declaration
            var type = types[i];
            typedefs += generateTypeMetadata(type);
        }
        return prefix + typedefs + suffix;
    }
    //return function (data, callback) {
    //    var result = 'Node.js welcomes ' + data;
    //    callback(null, result);
    //}
})(breezeref || (breezeref = {}));
//# sourceMappingURL=generate.js.map