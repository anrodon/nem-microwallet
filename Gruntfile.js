'use strict';
module.exports = grunt => {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);
    const serveStatic = require('serve-static');

    let config = {
        'src': 'src',
        'dist': 'dist',
        'root': ''
    };

    grunt.initConfig({
        app: config,
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= app.dist %>/{,*/}*',
                        '!<%= app.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= app.src %>',
                        dest: '<%= app.dist %>',
                        src: [
                            '*.html',
                            'img/**/*.*',
                            'fonts/**/*.*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= app.root %>',
                        dest: '<%= app.dist %>',
                        src: [
                            'manifest.json'
                        ]
                    }
                ]
            },
            styles: {
                expand: true,
                cwd: '<%= app.src %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },
        concat: {
          js: {
            src: [
                'src/js/modules/**/*.js',
                'src/js/*.js'
            ],
            dest: 'dist/js/scripts.js'
          },
          css: {
            src: 'src/css/*.css',
            dest: 'dist/css/styles.css'
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', [
        'clean:dist',
        'concat',
        'copy:dist'
    ]);

};
