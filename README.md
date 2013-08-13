# IronRouter

A reactive, highly customizable router that is Meteor specific -- it knows about
your subscriptions, data sources and helps you take care of common problems.

## License
MIT

## Installation

IronRouter can be installed with
[Meteorite](https://github.com/oortcloud/meteorite/). From inside a
Meteorite-managed app:

```sh
$ mrt add iron-router
```

## Quick Start
Check out the example JavaScript application in *examples/basic*.

## API

### Basics

By default, the Router takes over rendering the body of the page. To tell it
what to render, you provide a *route map*, which is a list of route names and
options:

```javascript
Router.map(function() { 
  this.route('home', {path: '/'});
  this.route('aboutUs');
});
```

By default the *name* of the route (the first argument to `this.route()`) is
also the name of the template to be rendered by this route. So for the code
above to work, you would need a template named `home` and a template named
`aboutUs`. Similarly, by default the route is rendered at `/<name>`, but as you
can see above, you can override this with the `path` option.

So, with the above route definition, browsing to the path `/` will lead to the
`home` template being rendered, and browsing to `/aboutUs` will lead to the
`aboutUs` template being rendered.

### Parameterized routes and route data

Often we want to provide a parameterized route, where a single definition gives
a route for each of a set of objects. Moreover, it's useful to pass the object
specified by the parameter as the *data context* of our template:

```js
Router.map(function() { 
  this.route('showPost', {
    path: '/posts/:_id',
    data: function() { return Posts.findOne(this.params._id); }
  });
});
```

This route will apply when any of `/posts/1`, `/posts/7` or
`/posts/Ze92xH3E89YPyRs4i` is visited, and will render the `showPost` template
with the data context (i.e. `this`) set to the relevant post from the `Posts`
collection.

### Waiting on data and dealing with 404s

Usually you'll want to wait on a subscription to load the documents into your
collection before try to find the correct post, and show a loading template in
the meantime. Additionally, you may want to choose the template to show when the
data is not there. All of these are possible:

```js
Router.map(function() { 
  this.route('showPost', {
    path: '/posts/:_id',
    data: function() { return Posts.findOne(this.params._id); },
    waitOn: postsSub,
    loading: 'loadingTemplate',
    notFound: 'notFoundTemplate'
  });
});
```

The argument to `waitOn` can be a subscription handle, or an array of
subscription handles. A subscription handle is what gets returned when you call
`Meteor.subscribe`.

### Named routes

The name of the route is as an easy way to access it. We can go directly to
a route with `Router.go('name')` (you can pass a path directly in here as well),
get its path with `Router.path('name')`, its URL with `Router.url('name')`,
and access either from a template with the `{{pathFor 'name'}}` and `{{urlFor
'name'}}` handlebars helpers. You can also access the `Route` instance itself by
calling `Router.routes['name']`.

To provide parameters for paths, pass an object with the correctly named
property avaliable:

```js
// it makes sense to use a post that came from the Posts collection:
Router.path('postShow', post);

// or in a pinch:
Router.path('postShow', {_id: '7'});
```

### Layouts

By default the current template will be rendered directly into the `<body>` tag.
If you want to share a common structure for all pages, you can use a layout.

A *layout* is simply a template which specifies one or more *yields* which the
router can render templates into.  For example, the following layout has two
named yields (`sidebar` and `footer`) in addition to the main yield.

```handlebars 
<template name="layout"> 
  <aside>
    <!-- render to the sidebar yield -->
    {{yield 'sidebar'}}
  </aside>

  <nav>
    <ul>
      <!-- static content here like nav links -->
    </ul>
  </nav>

  <!-- the main template will be rendered here -->
  {{yield}}

  <footer>
    <!-- render to the footer yield -->
    {{yield 'footer'}}
  </footer>
</template>
```

The layout enables a route to render multiple templates in addition to the main
template. You don't have to use a layout: if none is specified, the router just
uses a default layout which contains the only the main yield and no other named
yields.

To render into a named yield, you can use the `renderTemplates` option:

```js
Router.map(function() {
  this.route('home', {
    template: 'homeMain',
    renderTemplates: {
      'homeFooter': {to: 'footer'}
    }
  });
});
```

### Hooks

You can listen to the following hooks in a route's lifecycle:

  - `onBeforeRun` - Called one time before a controller is run.
  
  - `onBeforeRerun` - Called each time a controller is reactively re-run.
  
  - `onAfterRun` - Called once after a controller is run.
  
  - `onAfterRerun` - Called each time a controller is reactively re-run.
  

## Configuration

Configuration of the Router is hierarchical: settings flow from the Router to
routes and finally to route controllers. Our examples so far have demonstrated
settings at the Route level, however you can also set them on the Router as a
whole, or within a Route Controller class.

### Router Configuration

To set up a general layout for the router, you do something like the following.
This will render the template with the name `sidebar` to all yields named
`sidebar` and so on for `footer`, using the template called `layout`.

```javascript
Router.configure({
  layout: 'layout',

  notFoundTemplate: 'notFound',

  loadingTemplate: 'loading',

  renderTemplates: { 
    /* render the templated named footer to the 'footer' yield */
    'footer': { to: 'footer' },

    /* render the template named sidebar to the 'sidebar' yield */
    'sidebar': { to: 'sidebar' }
  }
});
```

### Controllers

All routes are handled by a RouteController, although you don't necessarily need
to create on yourself. There are four ways of specifying a controller:

 - `this.route('name', {controller: Controller})` - pass an subclass
   `RouteController` in directly
 
 - `this.route('name')` - will search for `NameController` in the global
   namespace.

 - `this.route('name', {}, function () {/* handler logic */})` - create an
   anonymous controller with a simple routing handler function.
 
 - `this.route('name', ...)` - creates an anonymous controller with the default
   route handler.
 
### Route handlers

The default handler renders the `template` into the main yield and the templates
defined in `renderTemplates` into the appropriate named yields, whilst
respecting the `waitOn` and `notFound` rules.

To define your own handler, either pass one in directly, or subclass
`RouteController` and define the `run()` method or an action method. Within a
handler, you can call `this.render(template, {to: X, data: Y});` to render a
given template to a yield with given data.

## Server Side Routing

Is a work in progress.

## Coffeescript Support

The Router has very good support for coffeescript. The inheritance model for
RouteControllers is the same as that of Coffeescript itself, so you can define
new controllers in a very intuitive way:

```coffeescript 
class @PostController extends RouteController template: 'post'
  renderTemplates: 'sidebar': to: 'sidebar' 'footer': to: 'footer'

  data: -> title: 'Hello World'

  run: -> console.log 'running' super
```

The above controller is created in the global namespace with the use of `@`, and
will be automatically used to render the route called `/post`.

## Examples

- Basic example in CoffeeScript:
  https://github.com/cmather/iron-router-coffeescript-example

## Contributing
We're happy to have contributors. If you're interested in contributing and not
sure where to start, drop Chris or Tom a line. You can also look for Github
issues marked *contribute*.
