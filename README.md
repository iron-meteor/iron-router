# Iron Router

A client and server side router designed specifically for Meteor.

## History

**Latest Version:** 0.6.0

See the History.md file for changes (including breaking changes) across
versions.

## Installation

1. Using [Meteorite](https://github.com/oortcloud/meteorite)

  The latest version is on Atmosphere.

  ```sh
  $ mrt add iron-router
  ```

2. Using a Local Repository

  This is useful if you're working off of the dev branch or contributing.

  1. Set up a local packages folder
  2. Add the PACKAGE_DIRS environment variable to your .bashrc file
    - Example: `export PACKAGE_DIRS="/Users/cmather/code/packages"`
    - Screencast: https://www.eventedmind.com/posts/meteor-versioning-and-packages
  3. Clone the repository into your local packages directory
  4. Add iron-router just like any other meteor core package like this: `meteor
     add iron-router`

  ```sh
  $ git clone https://github.com/eventedmind/iron-router.git /Users/cmather/code/packages
  $ cd my-project
  $ meteor add iron-router
  ```

## Getting Started
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

This creates a route with the name "home." The route is named so that you can
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

  // Catch All Route and the End for not found template
  // this will be matched last (if all other routes didn't match)
  this.route('notFound', {
    path: '*'
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
whever you'd like by setting a configuration option and using a Handlebars
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
better if we can call a function to return a url given a parameters object.
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
Handlbars helper. The Handlebars helper uses the current data context as the
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
<a href="{{pathFor 'postShow' sort_by=created_at}}">Post Show</a>
```
And you can pass a hash value using the Handlbars helper like this:

```html
<!-- given a context of {_id: 1} this will render '/posts/1?sort_by=created_at#someAnchorTag' -->
<a href="{{pathFor 'postShow' sort_by=created_at hash=someAnchorTag}}">Post Show</a>
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

You can change the template that is autmoatically rendered by providing a
template option.

```javascript
Router.map(function () {
  this.route('home', {
    path: '/',
    template: 'myHomeTemplate'
  });
});
```

The above example will math the `http://localhost:3000/` url (the `/` path) and
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
render. You can do this by using the `{{yield}}` helper. A basic layout would
look like this:

```html
<template name="layout">
  <div>
    {{yield}}
  </div>
</template>
```

But you can also specify "named" yields. This allows you to render templates
into any number of areas in the layout. For example:

```html
<template name="layout">
  <aside>
    {{yield 'aside'}}
  </aside>

  <div>
    {{yield}}
  </div>

  <footer>
    {{yield 'footer'}}
  </footer>
</template>
```

You can specify which templates to render into the named yields using the
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

The above example will render the template named `myAsideTemplate` to the yield
named `aside` and the template named `myFooter` to the yield named `footer`. The
main template `myHomeTemplate` specified by the `template` option will be
rendered into the **main** yield. This is the yield without a name
in the center that looks like this: `{{yield}}`.

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

If you provide a data function or object value it sets a Router level data
context that is maintained across routes. This allows for scenarios where you
don't want to change the data context from one route to another.

If the data property is set to false, the router's data context will be
maintained. This is the default value of the data property, so you only need to
set it if you're using custom RouteControllers.

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

    data: false // don't set a new data context (keep the existing one)
  });
});
```

You can access the current data context using the `getData` function inside of
any of your route functions (or RouteController functions). For example:

```javascript
Router.map(function () {
  this.route('post', {
    path: '/posts/:slug',

    waitOn: function () {
      return Meteor.subscribe('posts');
    },

    data: function () {
      return Posts.findOne({slug: this.params.slug});
    },

    before: function () {
      var post = this.getData();
    }
  });
});
```

If your data value or function returns null or undefined, the Router can
automatically render a not found template. This is useful if you want to render
a not found template for data that doesn't exist. The only thing you need to do
is provide a `notFoundTemplate` option to your route.

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

Note, the notFoundTemplate is only for data. It doesn't get rendered
automatically for browser paths that aren't matched. For example, the following
will **NOT** render the notFoundTemplate.

```javascript
// given a browser url of: http://localhost:3000/boguspath

Router.map(function () {
  this.route('home', {
    notFoundTemplate: 'notFound' // this is only for data, not for bad paths
  });
});
```

To render a not found template for bad url paths you can create a catch all
route as the last route like this:

```javascript
// given a browser url of: http://localhost:3000/boguspath

Router.map(function () {
  this.route('home', {
    notFoundTemplate: 'notFound' // this is only for data, not for bad paths
  });

  this.route('notFound', {
    path: '*' // catch all route
  });
});
```

### Waiting on Subscriptions
Sometimes it's useful to wait until you have data before rendering a page. For
example, let's say you want to show a not found template if the user navigates
to a good url (say, /posts/5) but there is no post with an id of 5. You can't
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
    path: '/posts/:_id',

    waitOn: function () {
      // NOTE: this.params is available inside the waitOn function.
      var slug = this.params.slug;
      return [Meteor.subscribe('posts'), Meteor.subscribe('comments', slug)];
    }
  });
});
```

When your route is run, it will wait on any subscriptions you've provided in
your `waitOn` function before running your before hooks, action method, and
after hooks. Under the hood, the waitOn function calls the `wait(handles, onReady,
onWaiting)` method of a RouteController (more on RouteControllers below). If you
need to customize this behavior you can skip providing a `waitOn` property and
just use the `wait` method directly in a custom action function or a before
hook.

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
      //  this.stop
      //  this.redirect
    }
  });
});
```

### Custom Rendering
If you provide a custom action function you'll need to control rendering
manually. You can do this by calling the `render` function. If you call
`this.render()` with no parameters, it will render the main template. For
example, given a simple layout and a template named "postShow":

```html
<template name="layout">
  {{yield}}
</template>

<template name="postShow">
  <h1>Post</h1>
</template>
```

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    action: function () {
      // render the postShow template into the main yield of the template
      this.render();
    }
  });
});
```

You can provide a different template name to render into the main yield by
providing the name of the template as the first parameter to the 'render'
function.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    action: function () {
      // render someOtherTemplate into the main yield of the template
      this.render('someOtherTemplate');
    }
  });
});
```

You can render a template into a **named yield** by passing the `to` option to
the render method and specifying the name of the yield to render into.

```html
<template name="layout">
  <aside>
    {{yield 'aside'}}
  </aside>

  <div>
    <!-- main yield -->
    {{yield}}
  </div>

  <footer>
    <!-- named yield -->
    {{yield 'footer'}}
  </footer>
</template>
```

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    action: function () {
      // render the main template
      this.render();

      // render myCustomFooter into the footer yield
      this.render('myCustomFooter', { to: 'footer' });

      // render myCustomAside into the aside yield
      this.render('myCustomAside', { to: 'aside' });
    }
  });
});
```

Finally, you can save some typing by passing an object of template to options as
the first parameter to the render function.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    action: function () {
      // render the main template
      this.render();

      // combine render calls
      this.render({
        'myCustomFooter': { to: 'footer' },
        'myCustomAside': { to: 'aside' }
      });
    }
  });
});
```

*Note: layouts are at the route level, not the template level and you have one
layout per route or a globally defined layout.*

### Before and After Hooks
Sometimes you want to execute some code *before* or *after* your action function
is called. This is particularly useful for things like showing a login page
anytime a user is not logged in. You might also put mixpanel tracking code in a
before/after hook. You can declare before and after hooks by providing `before`
and `after` options to the route. The value can be a function or an array of
functions which will be executed in the order they are defined.

```javascript
Router.map(function () {
  this.route('postShow', {
    path: '/posts/:_id',

    before: function () {
      if (!Meteor.user()) {
        // render the login template but keep the url in the browser the same
        this.render('login');

        // stop the rest of the before hooks and the action function 
        this.stop();
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

    after: function () {
      // this is run after our action function
    }
  });
});
```

Hooks and your action function are reactive by default. This means that if you
use a reactive data source inside of one of these functions, and that reactive
data source invalidates the computation, these functions will be run again.

### Non Reactive Routes
You can make your route non-reactive by providing the `reactive: false` option
to the route.

```javascript
Router.map(function () {
  this.route('nonReactiveRoute', {
    reactive: false,

    action: function () {
      // this function will not be re-run because of reactive data
      // changes.
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

Server action functions (RouteControllers) have different properties and methods
available. Namely, there is no rendering on the server yet. So the `render`
method is not available. Also, you cannot `waitOn` subscriptions or call the
`wait` method on the server. Server routes get the bare `request`, `response`,
and `next` properties of the Connect request, as well as the params object just
like in the client.

```javascript
Router.map(function () {
  this.route('serverFile', {
    path: '/files/:filename',

    action: function () {
      var filename = this.params.filename;

      this.response.writeHead(200);
      this.response.writeHead('Content-Type', 'text/html');
      this.response.write('hello from server');
      this.response.end();
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
hood they were getting creating automatically for us when our routes were run.
These are called "anonymous" `RouteController`s. But we can create our own like
this:

```javascript
PostShowController = RouteController.extend({
  /* most of the options we've been using in our routes can be used here */
});
```

How does a route know about our custom RouteController? Let's say we have a
route named "postShow." When the route is run, it will look for a global object
named "PostShowController," after the name of the route. We can change this
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

  before: function () {
  },

  after: function () {
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

Note that `before` and `after` are class level methods of our new controller. We
can pass them as properties to the `extend` method for convenience. But we can
also do this:

```javascript
PostShowController.before(function () {});
PostShowController.after(function () {});
```

In Coffeescript we can use the language's native inheritance.

```coffeescript
class @PostShowController extends RouteController
  @before ->
    # do some before stuff and note this is a class level method call '@'

  @after ->
    # call the class level after method using '@'

  layout: 'layout'

  template: 'myTemplate'
```

## Filing Issues and Contributing
Contributors are very welcome. There are many things you can help with,
including finding and fixing bugs, creating examples for the examples folder,
contributing to improved design or adding features. Some guidelines below:

* **Questions**: For now, it's okay to ask a question on Github Issues if you're
  having trouble since the volume is manageable. This might change if it starts
  to overshadow development! Just prefix your Github Issue with 'Question: ' so
  we can differentiate easily. Also, please make sure you've read through this
  document and tried a few things before asking. This way you can be very
  specific in your question. Also, please provide a cloneable Github repository
  if the issue is complex. For more complex questions sometimes it's hard to get all of the context
  required to solve a problem by just looking at text.

* **New Features**: If you'd like to work on a feature for the iron-router,
  start by creating a 'Feature Design: Title' issue. This will let people bat it
  around a bit before you send a full blown pull request. Also, you can create
  an issue to discuss a design even if you won't be working on it. Any
  collaboration is good! But please be patient :-).

* **Bugs**: If you find a bug and it's non-obvious what's causing it (almost
  always) please provide a reproduction Github project and give some context
  around the bug. Pasting in a snippet of JavaScript probably won't be enough.

* **Answer Questions!**: If you can help another user please do!

## License

MIT
