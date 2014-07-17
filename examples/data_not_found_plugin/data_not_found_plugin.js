Router.configure({
  // optionally specify a not found template for the dataNotFound hook.
  notFoundTemplate: 'DataNotFound'
});

Router.plugin('dataNotFound');

Router.route('/', {
  name: 'home',

  data: function () {

    /**
     * To render the normal template change to:
     *
     * return { title: 'Some title' };
     */
    return null;
  }
}); 
