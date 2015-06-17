module.exports = function(grunt) {

  grunt.initConfig({
    markdown: {
      all: {
        files: {
          'index.html': 'Guide.md'
        }
      },
      options: {
        template: 'templates/main-template.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-markdown');

  grunt.registerTask('default', ['markdown']);

};