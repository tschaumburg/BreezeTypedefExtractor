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

        breezets: {
            planapi: {
                options: {
                    //outdir: path.resolve("."),
                    breezeinfoFile: path.resolve("test", "plans.breezeinfo")
                }
            },
            boardapi: {
                options: {
                    //outdir: path.resolve("."),
                    breezeinfoFile: path.resolve("test", "boardmanager.breezeinfo")
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
    grunt.registerTask('test', ['breezets:boardapi']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['test']);

};