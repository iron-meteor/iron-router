# Iron Router [![Build Status](https://travis-ci.org/EventedMind/iron-router.png)](https://travis-ci.org/EventedMind/iron-router)

A client and server side router designed specifically for Meteor.


## History

**Latest Version:** 0.7.1

See the [History.md](History.md) file for changes (including breaking changes) across
versions.

## About

Iron Router is a *routing* package for Meteor. It makes single page apps.

IR takes control of your `<body>` tag, rendering templates based on the user's current URL. It also helps you set up subscriptions per-route and much more.

Iron Router works with Meteor 0.8.0 and above. To use an earlier version, use a version of IR less than 0.7.0.

##  Installation

Iron Router can be installed with [Meteorite](https://github.com/oortcloud/meteorite/). From inside a Meteorite-managed app:

``` sh
$ mrt add iron-router
```

## API
More detailed documentation can be found [here](DOCS.md).

### Basics

#### Declaring a route

You place your route declarations in a `Router.map` block: 

```javascript
Router.map(function() {
  this.route('home', {path: '/'});
  this.route('about');
});
```

The first route is named `home`, and will render a template named `home` at the path `/`. The second is named `about`, and will render a template named `about` at the path `/about`.

You should define your routes in a file common to the client and server so both contexts can use them.

#### Using routes

To use a route in your app, you can use the `{{pathFor}}` handlebars helper:

```html
<a href="{{pathFor 'home'}}">Go home!</a>
```

Or, call `Router.path('home')` to get it as a string.

The router will pick up internal clicks on links to routes. 
Alternatively, you can directly call `Router.go()` in a event handler:

```javascript
Template.foo.events({
 'click .homeLink': function() {
    Router.go('home');
  }
});
```

#### Parameterized routes and data

As your application starts dealing with data, you'll probably want to write more than a few static routes.

A standard pattern is a route per object in a collection. You can achieve this with a parameterized route:

```javascript
this.route('postsShow', { 
  path: '/posts/:_id',
  data: function() { return Posts.findOne(this.params._id); }
});
```

This route will match *any* URL of the form `'/posts/X'`, making the value of `X` available on the `this.params._id` property of the matching *controller*.

`this` is an instance of a `RouteController` in the data function above. The value returned from the data function can be used in our templates.

So our template might look like (if posts have a `title` field):

```html
<template name="postsShow">
  <h1>{{title}}</h1>
</template>
```


#### Controlling subscriptions

The example above assumes that you've already loaded the relevant post into your application, but usually you want to load data on demand as you hit a route. To do this, we can expand the example to use `waitOn`:

```javascript
this.route('postsShow', { 
  path: '/posts/:_id',
  waitOn: function() { return Meteor.subscribe('post', this.params._id)},
  data: function() { return Posts.findOne(this.params._id); }
});
```

Returning a subscription handle, or anything with a `ready` method from the `waitOn` function will add the handle to a wait list. When you call `this.ready()` in any of your other route functions, the result is true if all items in the wait list are ready. This lets us do things like show a loading indicator while waiting for data. You can implement a loading indicator in your route like this:

```javascript
this.route('postsShow', {
  waitOn: function () {
    return Meteor.subscribe('post', this.params._id);
  },

  action: function () {
    if (this.ready())
      this.render();
    else
      this.render('loading');
  }
});
```

But instead of writing this code yourself, you can use the 'loading' hook that comes with Iron Router like this:

```javascript
Router.onBeforeAction('loading');
```

### Advanced

#### Layouts + rendering

By default, the router renders the current template directly into the body. If you'd like to share common HTML between routes, you can create your own layout:

```html
<template name="masterLayout">
  <nav>...</nav>
  <div id="content">
    {{> yield}}
  </div>
</template>
```

You can set the layout via the `layoutTemplate` option to a route or in `Router.configure({...})`.

Layouts are very flexible. You can read more about them [in the docs](DOCS.md#using-a-layout-with-yields).

#### Route options

There are some extra routing options of interest:

 - `template` - the template to render. We've seen that by default this is just the name of the route.
- `layoutTemplate` - the layout template to render.
 - `loadingTemplate` - the template used by the `loading` hook.
 - `notFoundTemplate` - the template used by the `dataNotFound` hook -- renders if the `data()` function returns something falsey.
 - `where` - whether this route runs on the client or the server

Where it makes sense, options can be set globally via `Router.configure()`.

#### Custom actions and hooks

You can hook into the route run cycle via the following hooks:

 - `onRun` - this happens *once only* when the route is loaded. 
 
   NOTE: if the page hot code reloads, the onRun hook *will not re-run*. This makes it appropriate for things like analytics, or setting session variables and not for on-page setup.
 - `onData` - runs reactively whenever the data changes.
 - `onBeforeAction` - runs reactively before the action.
 - `onAfterAction` - likewise, after the action.
 - `onStop` - runs once when the controller is stopped, like just before a user routes away.

You can also change the action of a route via the `action` option. By default, the controller calls `this.render()`, which renders the relevant templates to the layout. You can call it yourself in an action function -- but if you are doing that you are probably better served using a `onBeforeAction` or `onAfterAction` hook.

All hooks (and `waitOn`) can be set globally to the router via (for example):

```javascript
Router.onRun(function() {
  console.log('Reached non-home page!');
}, {except: 'home'});
```

The second argument can be `except` -- a list of routes to not apply to, or `only` -- a limited set of routes to match.

#### Server routing

Most of the above only applies to client routes (we can't render templates on the server right now). 

When you define a server route (via `where: 'server'`), you need to define the `action` function, and use in a fairly simplistic way, much like [express](http://expressjs.com):

```javascript
this.route('serverRoute', {
  where: 'server',
  action: function() {
    this.response.end("THIS IS A SERVER ROUTE..");
  }
})
```

[Read more about server routes](DOCS.md#server-side-routing).

#### Route Controllers

We've mentioned that `this` in route callbacks is a *Route Controller*. Explicitly defining controllers allows you to use inheritance:

```javascript
AdminController = RouteController.extend({
  before: // a user filter to control access?
});

PostsEditController = AdminController.extend({
  waitOn: function() { return Meteor.subscribe('adminPost', ...); }
});

Router.map(function() {
  // this will automatically match the `PostsEditController` thanks to the name.
  this.route(postsEdit, {path: '/posts/:_id/edit'});
});
```

[Read more about route controllers](DOCS.md#route-controllers).


### More

For full details see the [Docs](DOCS.md)

## Contributing

Contributors are very welcome. There are many things you can help with,
including finding and fixing bugs, creating examples for the examples folder,
contributing to improved design or adding features. Some guidelines below:

* **Questions**: Please post to Stack Overflow and tag with `iron-router` : http://stackoverflow.com/questions/tagged/iron-router.

* **New Features**: If you'd like to work on a feature for the iron-router,
  start by creating a 'Feature Design: Title' issue. This will let people bat it
  around a bit before you send a full blown pull request. Also, you can create
  an issue to discuss a design even if you won't be working on it. Any
  collaboration is good! But please be patient :-).

* **Bugs**: If you find a bug and it's non-obvious what's causing it (almost
  always) please provide a reproduction Github project and give some context
  around the bug. Pasting in a snippet of JavaScript probably won't be enough.

* **Answer Questions!**: If you can help another user please do!

How to create a reproduction:
https://www.eventedmind.com/feed/github-issues-and-reproductions

#### Local installation

  This is useful if you're working off of the dev branch or contributing.

  1. Set up a local packages folder
  2. Add the PACKAGE_DIRS environment variable to your .bashrc file
    - Example: `export PACKAGE_DIRS="/Users/cmather/code/packages"`
    - Screencast: https://www.eventedmind.com/posts/meteor-versioning-and-packages
  3. Clone the repository into your local packages directory
  4. Add iron-router just like any other meteor core package like this: `meteor
     add iron-router`

  ```sh
  $ git clone https://github.com/EventedMind/iron-router.git /Users/cmather/code/packages
  $ cd my-project
  $ meteor add iron-router
  ```

## License

MIT
