# Iron Router

A client and server side router designed specifically for Meteor.

**Table of Contents**

- [Key Concepts](#key-concepts)
  - [Named Routes](#named-routes)
  - [Route Options](#route-options)
  - [Route Paths and Parameters](#route-paths-and-parameters)
  - [Dynamic Path Segments](#dynamic-path-segments)
  - [Query Strings and Hash Segments](#query-strings-and-hash-segments)
- [Client Side Routing](#client-side-routing)
  - [Rendering the Router](#rendering-the-router)
  - [Path Functions and Helpers](#path-functions-and-helpers)
  - [Changing routes programmatically](#changing-routes-programmatically)
  - [Rendering Templates](#rendering-templates)
  - [Using a Layout with Yields](#using-a-layout-with-yields)
  - [Data](#data)
  - [Waiting on Subscriptions (waitOn)](#waiting-on-subscriptions-waiton)
  - [Waiting on Subscriptions (wait)](#waiting-on-subscriptions-wait)
  - [Using a Custom Action Function](#using-a-custom-action-function)
  - [Custom Rendering](#custom-rendering)
  - [Using hooks](#using-hooks)
  - [Before and After Hooks](#before-and-after-hooks)
  - [Unload Hook](#unload-hook)
  - [Global Router Configuration](#global-router-configuration)
- [Server Side Routing](#server-side-routing)
- [Route Controllers](#route-controllers)
- [Examples](#examples)
  - [Parsing Url Parameters (OAuth Example)](#parsing-url-parameters-oauth-example)

## Key Concepts
Once you add the iron-router package the global `Router` object is available on
the client and on the server. So you can create your routes and configure the
router outside of your `Meteor.isClient` and `Meteor.isServer` blocks. Or, if
you are only going to be using client side routes, it's okay to put the routing
code in your `client/` folder.

### Named Routes
You can declare a named route like this:

```javascript
Router.map(function () {
  this.route('home');
});
```

This creates a route with the name "home". The route is named so that you can
quickly get the route by name like this: `Router.routes['home']`. 

By default, routes are created as client routes. This means, the route will only
be run on the client, and not the server. When you click a link that maps to a
client side route, the route will be completely run in the browser without
making a trip to the server. If you click a link that maps to a server route,
the browser will make a server request and the server side router will handle
the link. More information on server side routes is provided below.

### Route Options
You'll typically provide options to your route. At the very least, you'll tell
the route what `path` it should match. You provide options to the route by
passing an object as the second parameter to `this.route` like this:

```javascript
Router.map(function () {
  this.route('home', {
    /* options will go here */
  });
});
```

### Route Paths and Parameters
The first option you will almost always provide to the route is a `path`. By
default, the route will use its own name for the path. For example given the
following route:

```javascript
Router.map(function () {
  this.route('home');
});
```
The route will map to the path `/home`. But you'll likely want to provide a
custom path. You can provide a custom path like this:

```javascript
Router.map(function () {
  this.route('home', {
    path: '/' // match the root path
  });
});
```

When the url changes, the Router looks for the first Route that matches the
given url path. In this example, when the application first loads, the url will
be: `http://localhost:3000/` and the `home` route will match this path.

### Dynamic Path Segments
Paths get compiled into a regular expression and can support dynamic segments.
You can even use a regular expression as your path value. The values of these
params are made available inside of any route functions using
`this.params`. You'll see examples of different route functions below. But to
get us started, here are a few examples of dynamic paths:

```javascript
Router.map(function () {
  // No Parameters
  this.route('posts', {
    // matches: '/posts'
    // redundant since the name of the route is posts
    path: '/posts' 
  }); 

  // One Required Parameter
  this.route('postShow', {
    // matches: '/posts/1'
    path: '/posts/:_id' 
  });

  // Multiple Parameters
  this.route('twoSegments', {
    // matches: '/posts/1/2'
    // matches: '/posts/3/4'
    path: '/posts/:paramOne/:paramTwo'
  });

  // Optional Parameters
  this.route('optional', {
    // matches: '/posts/1'
    // matches: '/posts/1/2'
    path: '/posts/:paramOne/:optionalParam?'
  });

  // Anonymous Parameter Globbing 
  this.route('globbing', {
    // matches: '/posts/some/arbitrary/path'
    // matches: '/posts/5'
    // route globs are available
    path: '/posts/*'
  });

  // Named Parameter Globbing
  this.route('namedGlobbing', {
    // matches: '/posts/some/arbitrary/path'
    // matches: '/posts/5'
    // stores result in this.params.file
    path: '/posts/:file(*)'
  });

  // Regular Expressions
  this.route('regularExpressions', {
    // matches: '/commits/123..456'
    // matches: '/commits/789..101112'
    path: /^\/commits\/(\d+)\.\.(\d+)/
  });
});
```

### Query Strings and Hash Segments
Query strings and hashes aren't used to match routes. But they are made
available as properties of `this.params` inside of your route functions. We
haven't talked about the various route functions yet, but here is an example:

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',
    data: function () {
      // the data function is an example where this.params is available

      // we can access params using this.params
      // see the below paths that would match this route
      var params = this.params;

      // query params are added as normal properties to this.params.
      // given a browser path of: '/posts/5?sort_by=created_at
      // this.params.sort_by => 'created_at'

      // the hash fragment is available on the hash property
      // given a browser path of: '/posts/5?sort_by=created_at#someAnchorTag
      // this.params.hash => 'someAnchorTag'
    }
  });
});
```

## Client Side Routing

### Rendering the Router
By default, the Router is rendered (appended) automatically to the document body
when the DOM is ready. You can override this behavior and render the Router
whenever you'd like by setting a configuration option and using a Handlebars
helper like this:

```javascript
Router.configure({
  autoRender: false
});
```

```html
<body>
  <div>
    Some static content goes here
  </div>

  <div>
    {{renderRouter}}
  </div>
</body>
```

### Path Functions and Helpers
Once your application becomes large enough, it becomes a pain to hard code urls
everywhere. If you end up changing your route path a little, you need to find
all of the href tags in your application and change those as well. It's much
better if we can call a function to return a URL given a parameters object.
There are a few Handlebars helpers you can use directly in your HTML. You can
also call the `path` and `url` methods on a route itself. 

Let's say we have a route named "postShow" defined like this:

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id'
  });
});
```

You can call the Route's path function to get a path for a given parameter
object. For example:

```javascript
Router.routes['postShow'].path({_id: 1}) => '/posts/1'
```

You can pass query params and a hash value as an option like this:

```javascript
Router.routes['postShow'].path({_id: 1}, {
  query: 'sort_by=created_at',
  hash: 'someAnchorTag'
});
```

The query option can also be a regular JavaScript object. It will automatically
be turned into a query string. The above example would also work here:

```javascript
Router.routes['postShow'].path({_id: 1}, {
  query: {
    sort_by: 'created_at'
  },

  hash: 'someAnchorTag'
});
```

You can get paths and urls for named routes directly in your html using a global
Handlebars helper. The Handlebars helper uses the current data context as the
first parameter to the `path` function shown above.

```html
<!-- given a context of {_id: 1} this will render '/posts/1' -->
<a href="{{pathFor 'postShow'}}">Post Show</a>
```

You can change the data context before using the pathFor helper using the
Handlebars `{{#with ...}}` helper like this:

```html
{{#with someOtherPost}}
  <!-- someOtherPost now sets the data context -->
  <!-- so say someOtherPost = { _id: 5 } then this renders '/posts/5' -->
  <a href="{{pathFor 'postShow'}}">Post Show</a>
{{/with}}
```

You can pass query params using the Handlebars helper like
this:

```html
<!-- given a context of {_id: 1} this will render '/posts/1?sort_by=created_at' -->
<a href="{{pathFor 'postShow' query='sort_by=created_at'}}">Post Show</a>
```
And you can pass a hash value using the Handlbars helper like this:

```html
<!-- given a context of {_id: 1} this will render '/posts/1?sort_by=created_at#someAnchorTag' -->
<a href="{{pathFor 'postShow' query='sort_by=created_at' hash='someAnchorTag'}}">Post Show</a>
```

### Changing routes programmatically

Sometimes you'll need to change the route without the user clicking a link. For this you can use `Router.go`:

```javascript
// you can pass a fully formed URL path in
Router.go('/posts/7');

// but more likely, you'll want to use a route name and pass in arguments,
// as you would in `pathFor`
Router.go('postShow', {_id: 7});
```

The current route is returned reactively by `Router.current()`. It can be `null` (just like `Meteor.user()` can be null) so it's best to guard when working with reactive return values. For example, to find the current path:

```javascript
var current = Router.current();
return current && current.path;
```

Inside a route controller (such as in a hook), you don't need to call `Router.current()` because `this` already points to the current route. For example, to track pages visited by users using the [analytics](https://atmospherejs.com/package/analyticsjs) package:

```javascript
Router.configure({
  ...
  load: function () {
    analytics.page(this.path);
  }
});
```

### Rendering Templates
The default action for a route is to render a template. You can specify a
template as an option to the route. If you don't provide a template, the route
will assume the template name is the same as the route name. For example:

```javascript
Router.map(function () {
  this.route('home', {
    path: '/'
  });
});
```
When you navigate to 'http://localhost:3000/' the above route will automatically
render the template named `home`.

You can change the template that is automatically rendered by providing a
template option.

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate'
  });
});
```

The above example will map the `http://localhost:3000/` url (the `/` path) and
automatically render the template named `myHomeTemplate`.

### Using a Layout with Yields
Often times it's useful to have a layout template for a route. Then your route
template renders into the layout. You can actually render multiple templates
into the layout. You can specify a layout template by providing the
`layoutTemplate` option to your route.

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate',
    layoutTemplate: 'layout'
  });
});
```

The layout template must declare where it wants various child templates to
render. You can do this by using the `{{> yield}}` helper. A basic layout would
look like this:

```html
<template name="layout">
  <div>
    {{> yield}}
  </div>
</template>
```

But you can also specify regions. This allows you to render templates
into any number of regions in the layout. For example:

```html
<template name="layout">
  <aside>
    {{> yield region='aside'}}
  </aside>

  <div>
    {{> yield}}
  </div>

  <footer>
    {{> yield region='footer'}}
  </footer>
</template>
```

You can specify which templates to render into the region using the
`yieldTemplates` option of your route. For example:

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate',
    layoutTemplate: 'layout',
    yieldTemplates: {
      'myAsideTemplate': {to: 'aside'},
      'myFooter': {to: 'footer'}
    }
  });
});
```

The above example will render the template named `myAsideTemplate` to the region
named `aside` and the template named `myFooter` to the region named `footer`. The
main template `myHomeTemplate` specified by the `template` option will be
rendered into the **main** region. This is the region without a name
in the center that looks like this: `{{> yield}}`.

### Data
You can provide a data context for the current route by providing a `data`
option to your route. The `data` value can either be an object or a function
that gets evaluated later (when your route is run). For example:

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate',
    layoutTemplate: 'layout',
    yieldTemplates: {
      'myAsideTemplate': {to: 'aside'},
      'myFooter': {to: 'footer'}
    },

    data: {
      title: 'Some Title',
      description: 'Some Description'
    }
  });
});
```

Given the above data context, our templates could use the data context like
this:

```html
<template name="myHomeTemplate">
  {{title}} - {{description}}
</template>
```

The data property can also be a function which is evaluated when the route is
actually run.

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate',
    layoutTemplate: 'layout',
    yieldTemplates: {
      'myAsideTemplate': {to: 'aside'},
      'myFooter': {to: 'footer'}
    },

    data: function () {
      // this.params is available inside the data function
      var params = this.params;

      return {
        title: 'Some Title',
        description: 'Some Description'
      }
    }
  });
});
```
You can set the global data context of the Router by calling the `setData`
function of the Router or a RouteController. The data context only invalidates
computations if the data has actually changed from the last time it was set.

You can access the current data context using the `getData` function inside of
any of your route functions (or RouteController functions). For example:

```javascript
Router.map(function () {
  this.route('post', {
    path: '/posts/:slug',

    waitOn: function () {  // wait for the subscription to be ready; see below
      return Meteor.subscribe('posts');
    },

    data: function () {
      return Posts.findOne({slug: this.params.slug});
    },

    onBeforeAction: function () {
      var post = this.getData();
    }
  });
});
```

If your data value or function returns null or undefined, the Router can
automatically render a not found template. This is useful if you want to render
a not found template for data that doesn't exist. You need to do two things - 
  1. Provide a `notFoundTemplate` option to your route.
  2. Turn the `dataNotFound` hook on 

```javascript
if (Meteor.isClient) {
  Router.onBeforeAction('dataNotFound');
}

Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate',
    layoutTemplate: 'layout',
    yieldTemplates: {
      'myAsideTemplate': {to: 'aside'},
      'myFooter': {to: 'footer'}
    },

    // render notFound template when data is null or undefined
    notFoundTemplate: 'notFound', 
    data: function () {

      // return Posts.findOne({_id: this.params._id});
      // if the post isn't found then render the notFound template

      // if data function returns null then notFound template is rendered.
      return null;
    }
  });
});
```

If you provide a global `notFoundTemplate`, it will get rendered automatically if
a user visits an un-matched path, assuming it's not already handled on the server-side:

```javascript
// given a browser url of: http://localhost:3000/boguspath

Router.configure({
  notFoundTemplate: 'notFound' // this will render
});
```

### Waiting on Subscriptions (`waitOn`)

Sometimes it's useful to wait until you have data before rendering a page. For
example, let's say you want to show a not found template if the user navigates
to a good url (say, `/posts/5`) but there is no post with an id of 5. You can't
make this determination until the data from the server has been sent.

To solve this problem, you can **wait** on a subscription, or anything with a
reactive `ready()` method. To do this, you can provide a `waitOn` option to your
route like this:

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    waitOn: function () {
      return Meteor.subscribe('posts');
    }
  });
});
```

The `waitOn` function can return any object that has a `ready` method. It can
also return an array of these objects if you'd like to wait on multiple
subscriptions.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:slug',

    waitOn: function () {
      // NOTE: this.params is available inside the waitOn function.
      var slug = this.params.slug;
      return [Meteor.subscribe('posts'), Meteor.subscribe('comments', slug)];
    }
  });
});
```

When your route is run, it will wait on any subscriptions you've provided in
your `waitOn` function. If you've provided a `loadingTemplate`, the default action 
will be to render that template.

While waiting, you can check if your subscriptions are ready in your `onBeforeAction`
hooks, `action` method, and `onAfterAction` hooks, by checking `this.ready()`. 

Under the hood, the waitOn function calls the `wait(handles, onReady,
onWaiting)` method of a RouteController (more on RouteControllers below). If you
need to customize this behavior you can skip providing a `waitOn` property and
just use the `wait` method directly in a custom action function or an `onBeforeAction`
hook.

You can also wait for certain subscriptions on a global level, by passing a `waitOn`
function in the `Router.configure()` call:

```js
Router.configure({
  waitOn: function () {
    return Meteor.subscribe('recordSetThatYouNeedNoMatterWhat');
  }
});
```


### Waiting on Subscriptions (`wait()`)

```js
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',
    onBeforeAction: function() {
      // wait on post
      this.subscribe('post', this.params._id).wait(); // wait

      // don't wait on posts
      this.subscribe('posts');
    }
  });
});
```

Calling `wait` on a subscription handle doesn't actually block anything. It just
adds the subscription handle to a list of handles we are reactively waiting on.
When all of these handles are ready `this.ready()` on the RouteController will
be true.

```js
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',
    
    // this is equivalent to 
    // waitOn: function() { 
    //   return Meteor.subscribe('posts', this.params.:id); }
    // }
    
    onBeforeAction: function() {
      this.subscribe('posts', this.params._id).wait();
    }
  });
});
```

### Using a Custom Action Function
So far, we haven't had to write much code to get our routes to work. We've just
provided configuration options to the route. Under the hood, when a route is
run, a RouteController gets created and an **action** method gets called on that
RouteController. On the client, the default action function just renders the
main template and then all of the yield templates. We can provide our own
action function like this:

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    action: function () {
      // this => instance of RouteController
      // access to:
      //  this.params
      //  this.wait
      //  this.render
      //  this.redirect
    }
  });
});
```

### Custom Rendering
You can render manually by calling the `render` function. There are three ways
to call the render method:

  1. `this.render()`: Render all of the templates for the Route or
     RouteController. This renders the main template into the main yield region,
     and all of the yieldTemplates into their associated `{{> yield region='name'}}`
     regions.
  2. `this.render('templateName')`: Render the template named 'templateName'
     into the main yield `{{> yield}}`.
  3. `this.render('templateName', {to: 'region'})`: Render the template named
     'templateName' into the region named 'region' `{{> yield region='region'}}`. 

*Note: layouts are at the route level, not the template level and you have one
layout per route or a globally defined layout.*

### Using hooks

There are four types of hooks that a route provides. All can be added at the global level, in a route definition, or defined for a controller.

- `onBeforeAction` - runs before the action function (possibly many times if reactivity is involved).
- `onAfterAction` - runs after the action function (also reactively)
- `load` - runs _just once_ when the route is first loaded. NOTE that this doesn't run again if your page reloads via hot-code-reload, so make sure any variables you set will persist over HCR (for example Session variables).
- `unload` - runs _just once_ when you leave the route for a new route.

You can also define global hooks which apply to a set of named routes:

```js
// this hook will run on almost all routes
Router.onBeforeAction(mustBeSignedIn, {except: ['login', 'signup', 'forgotPassword']});

// this hook will only run on certain routes
Router.onBeforeAction(mustBeAdmin, {only: ['adminDashboard', 'adminUsers', 'adminUsersEdit']});
```

### Before and After Hooks
Sometimes you want to execute some code *before* or *after* your action function
is called. This is particularly useful for things like showing a login page
anytime a user is not logged in. You can declare before and after hooks by
providing `onBeforeAction` and `onAfterAction` options to the route. The value can be a function
or an array of functions which will be executed in the order they are defined.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    onBeforeAction: function (pause) {
      if (!Meteor.user()) {
        // render the login template but keep the url in the browser the same
        this.render('login');

        // pause the rest of the before hooks and the action function 
        pause();
      }
    },

    action: function () {
      // render the main template
      this.render();

      // combine render calls
      this.render({
        'myCustomFooter': { to: 'footer' },
        'myCustomAside': { to: 'aside' }
      });
    },

    onAfterAction: function () {
      // this is run after our action function
    }
  });
});
```

Hooks and your action function are reactive by default. This means that if you
use a reactive data source inside of one of these functions, and that reactive
data source invalidates the computation, these functions will be run again.

### Unload Hook
Unload hooks will be called before a RouteController is unloaded and a new
RouteController is run. This hook is useful for cleaning up Session data for
example.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/login',

    unload: function () {
      // This is called when you navigate to a new route
      Session.set('postId', null);
    }
  });
});
```

### Global Router Configuration
So far we've been defining all of our route options on the routes themselves.
But sometimes it makes sense to define global options that apply to all routes.
This is most often used for the `layoutTemplate`, `notFoundTemplate`, and
`loadingTemplate` options. You can globally configure the Router like this:

```javascript
Router.configure({
  layoutTemplate: 'layout',
  notFoundTemplate: 'notFound',
  loadingTemplate: 'loading'
});
```

## Server Side Routing
Defining routes and configuring the Router is almost identical on the server and
the client. By default, routes are created as client routes. You can specify
that a route is intended for the server by providing a `where` property to the
route like this:

```javascript
Router.map(function () {
  this.route('serverRoute', {
    where: 'server',

    action: function () {
      // some special server side properties are available here
    }
  });
});
```

Note that `where` must be placed in `Router.map`, not on the controller.

Server action functions (RouteControllers) have different properties and methods
available. Namely, there is no rendering on the server yet. So the `render`
method is not available. Also, you cannot `waitOn` subscriptions or call the
`wait` method on the server. Server routes get the bare `request`, `response`,
and `next` properties of the Connect request, as well as the params object just
like in the client.

```javascript
Router.map(function () {
  this.route('serverFile', {
    where: 'server',
    path: '/files/:filename',

    action: function () {
      var filename = this.params.filename;

      this.response.writeHead(200, {'Content-Type': 'text/html'});
      this.response.end('hello from server');
    }
  });
});
```

## Route Controllers
Most of the time, you can define how you want your routes to behave by simply
providing configuration options to the route. But as your application gets
larger, you may want to separate the logic for handling a particular route into
a separate class. This is useful for putting route handling logic into separate
files, but also for utilizing features like inheritance. You can do this by
inheriting from `RouteController`. This works on both the client and the server,
but each has slightly different methods as described above.

Although we haven't been working with `RouteController`s directly, under the
hood they were getting created automatically for us when our routes were run.
These are called "anonymous" `RouteController`s. But we can create our own like
this:

```javascript
PostShowController = RouteController.extend({
  /* most of the options we've been using in our routes can be used here */
});
```

How does a route know about our custom RouteController? Let's say we have a
route named "postShow". When the route is run, it will look for a global object
named "PostShowController", after the name of the route. We can change this
behavior by providing a `controller` option to the route like so:

```javascript
Router.map(function () {

  // provide a String to evaluate later
  this.route('postShow', {
    controller: 'CustomController'
  });

  // provide the actual controller symbol if it's already defined
  this.route('postShow', {
    controller: CustomController
  });
});
```

We can define almost all of the same options on our RouteController as we have
for our routes. For example:

```javascript
PostShowController = RouteController.extend({
  template: 'postShow',

  layoutTemplate: 'postLayout',

  onBeforeAction: function () {
  },

  onAfterAction: function () {
  },

  waitOn: function () {
    return Meteor.subscribe('post', this.params._id);
  },

  data: function () {
    return Posts.findOne({_id: this.params._id});
  },

  action: function () {
    /* if we want to override default behavior */
  }
});
```

Note that `onBeforeAction` and `onAfterAction` are class level methods of our new
controller. We can pass them as properties to the `extend` method for convenience.
But we can also do this:

```javascript
PostShowController.onBeforeAction(function () {});
PostShowController.onAfterAction(function () {});
```

(But note `where` is not available on controllers, only in `Router.map`.)

In Coffeescript we can use the language's native inheritance.

```coffeescript
class @PostShowController extends RouteController
  onBeforeAction: ->
    # do some stuff before the action is invoked

  onAfterAction: ->
    # do some stuff after the action is invoked

  layout: 'layout'

  template: 'myTemplate'
```

## Examples

### Parsing Url Parameters (OAuth Example)  

Iron Router will automatically parse a parameterized URL request, and separate out the parameters into an object.  However, accessing those parameters requires extending a RouteController.  Consider the following scenario:

````ruby
# OAuth Configuration Scenario

# OAuth requires a redirect URL as part of it's configuration.
http://localhost:3600/stripe

# the oauth authentication process will redirect users to that URL with parameterized tokens
http://localhost:3600/stripe?scope=read_only&code=ac_2QGZP0nOBmb0Lxk9q3pMzaRvOi4fMU8j

# so the Router needs to parse the following line of code
?scope=read_only&code=ac_2QGZP0nOBmb0Lxk9q3pMzaRvOi4fMU8j

# in order to obtain the following parameters
scope = read_only
code = ac_2QGZP0nOBmb0Lxk9q3pMzaRvOi4fMU8j

````

To parse the ``scope`` and ``code`` parameters correctly, we need to set up something like the following:

````js
//---------------------------------------------------------------------------------------------------------------------
// Iron Router Configuration

Session.setDefault('oauth_scope', '');
Session.setDefault('oauth_code', '');

// create the route like normal; the parameters will be automatically parsed
Router.map(function() {
    this.route('stripeRedirect', { path: '/stripe'});
});

// and extend the controller, so you can access the this.params object
StripeRedirectController = RouteController.extend({
    run: function () {
        // the code parameter has been automatically parsed and is available for use
        console.log('stripe.code: ' + this.params.code);
        Session.set('oauth_code', this.params.code);

        // as is the scope parameter
        console.log('stripe.scope: ' + this.params.scope);
        Session.set('oauth_scope', this.params.scope);

        // when all this is done, be sure to render the template specified in the router map
        this.render('stripeRedirect');
    }
});
````

Once you have access to the parameters, there are numerous ways to pass those variables throughout your app.  `Session.set()` is just one method.  You'll need to choose whether you want to use reactive `Session` variables or not.  
