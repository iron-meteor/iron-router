# Iron Router

A client and server side router designed specifically for Meteor.

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

You can also set the data property to false. This indicates that you don't want
to set the data context to a new value, but instead, maintain the previous
value. This is useful if you you don't want to re-render templates that have
already been rendered if the data context doesn't need to change.

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

    data: false // don't set a new data context (keep the previous one)
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

### Using a Custom Action Function
XXX to be continued.

### Before and After Hooks

### Global Router Configuration

### Server Side Routing

## Route Controllers

### Client RouteController

### Server RouteController

## Router Concepts

## Filing Issues and Contributing
