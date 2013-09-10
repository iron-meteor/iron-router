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
parameters are made available inside of any route functions using
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

### Path Functions and Helpers

### Rendering Templates

### Using a Layout

### Using a Custom Action Function

### Data and Subscriptions

### Global Router Configuration

### Server Side Routing

## Route Controllers

### Client RouteController

### Server RouteController

## Router Concepts

## Filing Issues and Contributing
