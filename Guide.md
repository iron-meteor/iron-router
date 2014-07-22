# Iron.Router

A router that works on the server and the browser, designed specifically for
[Meteor](https://github.com/meteor/meteor).

## Table of Contents

- [About](#about)
- [Install](#install)
- [Quick Start](#quick-start)
- [Concepts](#concepts)

## About
Iron.Router is the most popular routing package for Meteor. Its job is to let
you organize your application by urls. This guide wil start off with some simple
examples and progress into more advanced concepts.

## Install
You can install iron:router using Meteor's package management system:

```bash
> meteor add iron:router
```

To update iron:router to the latest version you can use the meteor update
command:

```bash
> meteor update iron:router
```

## Quick Start

Start by creating a route in your JavaScript file. By default, routes are
created for the client and will run in the browser.

```javascript
Router.route('/', function () {
  this.render('Home');
});
```

When the user navigates to the url "/", the route above will render the template
named "Home" onto the page.

```javascript
Router.route('/items');
```

This second route will automatically render a template named "Items" or "items"
to the page. In simple cases like this, you don't even need to provide a route
function.

So far, we've only created routes that will be run directly in the browser. But
we can also create server routes. 

```javascript
Router.route('/item', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});
```

The `where: 'server'` option tells the Router this is a server side route.

## Concepts

## Notes

- Notes
  - Quickstart
    - installing
    - creating some routes
  - Concepts
    - routing on the server
    - routing on the client
    - making a trip back to the server
  - Layouts, yield, contentFor, setting layouts dynamically, etc.
  - Rendering
    - dynamically choosing the layout
    - Rendering templates into regions
    - Setting data contexts
    - Automatic rendering based on the name
  - Server side routing
    - restful routes
    - middleware
    - 404s for no routes found
  - Client side routing
    - client side middleware
  - Creating routes
    - naming routes, or not
    - route functions
    - automatic template lookup
  - Route Parameters
  - Route dispatching
    - What does this mean? controller gets created, anonymous or not
    - client vs. server routes
    - how does the router know when to go to the server or the client?
  - RouteControllers
    - The "this" arg inside of your function
    - How do they get created?
    - Creating your own
    - custom action functions and reusing controllers
    - wait and waitOn
    - options like layoutTemplate, template, name, etc.
  - Hooks
    - what are they?
    - how can you use them?
  - Plugins
    - Concept
    - loading, onDataNotFound
    - Creating your own
  - Rendering the Router
    - using the {{> Router}} template helper
    - autoRendering
  - Links and navigation
    - {{pathFor}} and {{urlFor}} helpers
    - Router.go
    - this.redirect
