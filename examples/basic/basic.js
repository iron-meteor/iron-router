Items = new Meteor.Collection('items');

Router.map(function () {
  this.route('home', {
    path: '/'
  });

  this.route('items', {
    controller: 'ItemsController',
    action: 'customAction'
  });
});

if (Meteor.isServer) {
  var seed = function () {
    Items.remove({});
    for (var i = 0; i < 100; i++) {
      Items.insert({body: 'Item ' + i});
    }
  };

  var Future = Npm.require('fibers/future');

  Meteor.publish('items', function () {
    var future = new Future;

    // simulate high latency publish function
    Meteor.setTimeout(function () {
      future.return(Items.find());
    }, 2000);

    return future.wait();
  });
}

if (Meteor.isClient) {
  Router.configure({
    layout: 'layout',
    notFoundTemplate: 'notFound',
    loadingTemplate: 'loading'
  });

  Subscriptions = {
    items: Meteor.subscribe('items')
  };

  ItemsController = RouteController.extend({
    template: 'items',

    /*
     * During rendering, wait on the items subscription and show the loading
     * template while the subscription is not ready.
     */

    waitOn: Subscriptions['items'],

    /*
     * By default the router will call the *run* method which will render the
     * controller's template (or the template with the same name as the route)
     * to the main yield area {{yield}}. But you can provide your own action
     * methods as well.
     */
    customAction: function () {

      /* render customController into the main yield */
      this.render('items');

      /*
       * You can call render multiple times. You can even pass an object of
       * template names (keys) to render options (values). Typically, the
       * options object would include a *to* property specifiying the named
       * yield to render to.
       *
       */
      this.render({
        itemsAside: { to: 'aside' },
        itemsFooter: { to: 'footer' }
      });
    }
  });
}
