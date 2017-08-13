/*
 * grunt-breezets
 * https://github.com/tschaumburg/breezets
 *
 * Copyright (c) 2017 tschaumburg
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');

module.exports = function (grunt)
{

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

  dolog: {
    foo: [1, 2, 3],
    bar: 'hello world',
    baz: false
  },

        breezets: {
            planapi: {
                options: {
                    //outdir: path.resolve("."),
                    breezeinfoFile: path.resolve("source", "Breeze reference", "plans.breezeinfo")
                }
            },
            first: {
                options: {
                    metadataurlValue: "https://first.metadata"
                }
            },
            second: {
                options: {
                    breezeinfoFile: "test/plans.breezeinfo"
                }
            },
            third: {
                options: {
                    metadataurlValue: "https://third.metadata"
                }
            }
        },

        // Configuration to be run (and then tested).
        jsonconst: {
            photoalbum: {
                options: {
                    language: 'c#',
                    namespace: 'x',
                    rootname: 'y'
                },
                src: ['test/fixtures/photoalbum.json'],
            },
            default_options: {
                options: {
                },
                files: [
                    'tmp/default_options'
                ]
            },
            custom_options: {
                options: {
                    separator: ': ',
                    punctuation: ' !!!'
                },
                files: {
                    'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
//    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['dolog', 'breezets:planapi']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['test']);

};