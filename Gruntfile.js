module.exports = function(grunt) {
    grunt.initConfig({
        // 配置文件，参考package.json配置方式，必须设置项是
        // name, version, author
        // name作为gallery发布后的模块名
        // version是版本，也是发布目录
        // author必须是{name: "xxx", email: "xxx"}格式
        pkg: grunt.file.readJSON('abc.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd h:MM:ss TT") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

        // kmc打包任务，默认情况，入口文件是index.js，可以自行添加入口文件，在files下面
        // 添加
        kmc: {
            options: {
                packages: [
                    {
                        name: '<%= pkg.name %>',
                        path: '../'
                    }
                ],
                map: [["<%= pkg.name %>/", "gallery/<%= pkg.name %>/"]]
            },
            main: {
                files: [
                    {
                        src: "<%= pkg.version %>/index.js",
                        dest: "<%= pkg.version %>/build/index.js"
                    },
                    {
                        src: "<%= pkg.version %>/base.js",
                        dest: "<%= pkg.version %>/build/base.js"
                    },
                    {
                        src: "<%= pkg.version %>/store.js",
                        dest: "<%= pkg.version %>/build/store.js"
                    },
                    {
                        src: "<%= pkg.version %>/tree.js",
                        dest: "<%= pkg.version %>/build/tree.js"
                    },
                    {
                        src: "<%= pkg.version %>/view.js",
                        dest: "<%= pkg.version %>/build/view.js"
                    },
                    {
                        src: "<%= pkg.version %>/viewstore.js",
                        dest: "<%= pkg.version %>/build/viewstore.js"
                    },
                    {
                        src: "<%= pkg.version %>/list.js",
                        dest: "<%= pkg.version %>/build/list.js"
                    },
                    {
                        src: "<%= pkg.version %>/select.js",
                        dest: "<%= pkg.version %>/build/select.js"
                    },
                    {
                        src: "<%= pkg.version %>/city.js",
                        dest: "<%= pkg.version %>/build/city.js"
                    }
                ]
            }
        },
        // 打包后压缩文件
        // 压缩文件和入口文件一一对应
        uglify: {
            options: {
                banner: '<%= banner %>',
                beautify: {
                    ascii_only: true
                }
            },
            base: {
                files: {
                    '<%= pkg.version %>/build/index-min.js': ['<%= pkg.version %>/build/index.js'],
                    '<%= pkg.version %>/build/base-min.js': ['<%= pkg.version %>/build/base.js'],
                    '<%= pkg.version %>/build/store-min.js': ['<%= pkg.version %>/build/store.js'],
                    '<%= pkg.version %>/build/tree-min.js': ['<%= pkg.version %>/build/tree.js'],
                    '<%= pkg.version %>/build/view-min.js': ['<%= pkg.version %>/build/view.js'],
                    '<%= pkg.version %>/build/viewstore-min.js': ['<%= pkg.version %>/build/viewstore.js'],
                    '<%= pkg.version %>/build/list-min.js': ['<%= pkg.version %>/build/list.js'],
                    '<%= pkg.version %>/build/select-min.js': ['<%= pkg.version %>/build/select.js'],
                    '<%= pkg.version %>/build/city-min.js': ['<%= pkg.version %>/build/city.js']
                }
            }
        },
        copy: {
            main: {
                files: [
                    {src: ['<%= pkg.version %>/tree.css'], dest: '<%= pkg.version %>/build/tree.css'},
                    {src: ['<%= pkg.version %>/list.css'], dest: '<%= pkg.version %>/build/list.css'}
                ]
            }
        },
        cssmin: {
            combine: {
                files: {
                    '<%= pkg.version %>/build/tree-min.css': ['<%= pkg.version %>/build/tree.css'],
                    '<%= pkg.version %>/build/list-min.css': ['<%= pkg.version %>/build/list.css']
                }
            }
        }
    });

    // 使用到的任务，可以增加其他任务
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-kmc');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    return grunt.registerTask('default', ['kmc', 'uglify', 'copy', 'cssmin']);
};