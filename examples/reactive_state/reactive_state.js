Router.configure({layoutTemplate: 'AppLayout'});

Router.route('/', {name: 'home'});

Router.route('/posts/:_id', function () {
  this.set('postId', this.params._id);
  this.render('Post');
});

/**
 * FIXME
 * Problem is that if the template doesn't change but we change controllers,
 * there's no way to tell the helper to invalidate. So we still are calling
 * controller.get(..) on the old controller. Take a look at the source and
 * see if there's a way to set the UI.controller and invalidate it perhaps
 * if it changes. Maybe use the same pattern as in UI._template().
 */
if (Meteor.isClient) {
  Template.Post.helpers({
    postId: function () {
      // what happens if UI.controller changes?
      var controller = UI.controller();
      return controller.get('postId');
    }
  });
}
