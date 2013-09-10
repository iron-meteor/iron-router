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

  Meteor.startup(seed);

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
    notFoundTemplate: 'notFound',
    loadingTemplate: 'loading',
    layoutTemplate: 'layout'
  });

  Subscriptions = {
    items: Meteor.subscribe('items')
  };

  ItemsController = RouteController.extend({
    template: 'items',

    /*
     * During rendering, wait on the items subscription and show the loading
     * template while the subscription is not ready. This can also be a function
     * that returns on subscription handle or an array of subscription handles.
     */

    waitOn: Subscriptions['items'],

    /*
     * The data function will be called after the subscrition is ready, at
     * render time.
     */

    data: function () {
      // we can return anything here, but since I don't want to use 'this' in
      // as the each parameter, I'm just returning an object here with a named
      // property.
      return {
        items: Items.find()
      };
    },

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
        itemsAside: { to: 'aside', waitOn: false, data: false },
        itemsFooter: { to: 'footer', waitOn: false, data: false }
      });
    }
  });
}
