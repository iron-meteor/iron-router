# Iron Router with Subscription Manager

### WARNING: THIS IS AN ALPHA QUALITY PROJECT

This is your favorite [Iron Router](https://github.com/EventedMind/iron-router) with a built in subscription manager. Usually Iron Router forget previous route's subscriptions when it's switching to a new route. It makes meteor to unsubscribe all the subscriptions of the previous route, which have not been used in the current route. This adds unwanted overhead to the app and shuttered the user experience. See this video for a better explanation.

Subscription Manager is a solution for that and improves the user experience and reduce the server overhead. See for yourself.

## Concepts

Subscription Manager and its functionality is turned off by default. But you can turn on them very easily. Before that you need to understand few concepts. Here are they.

### Thinking in Routes

Although, this is about subscriptions, we are dealing with routes to do the configurations. That means you are applying subscription manager rules to the all the subscriptions inside a route. 

### Caching

We can `cache` routes in terms of subscriptions. Let's say, your app is a blog, and it has a route like this: `post:_id`. 

With subscription manager, you can cache subscriptions for 5 blog posts. This is how we do it.

~~~js
this.route('home', {
  path: '/post/:_id',
  template: 'home',
  cache: 5,
  waitOn: function() {
    return Meteor.subscribe('post', this.params._id);
  },
  after: function() {
    this.subscribe('all_posts');
  }
});
~~~

### Expirations

Now we are caching subscriptions; this may add little overhead to our app since there might be unused subscriptions exists in the app. So that's why subscription expiration comes in. All you have to do is, simply add another configuration as `expireIn` specifying no of minutes. See following example.

~~~js
this.route('home', {
  path: '/post/:_id',
  template: 'home',
  cache: 5,
  expireIn: 3, //expire cached subscriptions in 3 minute
  waitOn: function() {
    return Meteor.subscribe('post', this.params._id);
  },
  after: function() {
    this.subscribe('all_posts');
  }
});
~~~

> You must enable caching in order apply expirations. Otherwise it doesn't make any sense.

## Configuration Methods

* As shown above you can add `cache` and `expireIn` as option for `this.route`.
* You can also add as a field, when you are extending `RouteController`
* You can also globally define it with `Router.configure`


## Installation

Replace `"iron-router": {}` from your `smart.json` into following:

~~~shell
"iron-router": {
  "git": "git://github.com/EventedMind/iron-router.git",
  "branch": "sub-manager"
}
~~~

You can expect API and semantic changes until this will be merged into `dev` branch. So, just join into this mailing list; I'll notify you, if there is any significant change.

## License

MIT
