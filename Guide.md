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

### Server only
In a typical Web app, you make an http request to a server at a particular url,
like "/items/5", and a router on the server decides which function to invoke for
that particular route. The function will most likely send some html back to the
browser and close the connection.

### Client only
In some more modern Web apps you'll use a "client side" router like pagejs or
Backbone router. These routers run in the browser, and let you navigate around
an application without making trips to the server by taking advantage of browser
HTML5 features like pushState or url hash fragments. 

### Client and server
Iron.Router runs on the client *and* the server. You can define a route that
only should run on the server, or a route that should only run on the client.
Most of the time you'll create routes on the client. This makes your app really
fast once it's loaded, because as you navigate around the application, you don't
need to load an entirely new html page.

The router is *aware* of all the routes on the client and the server. This means
you can click a link that takes you to a server route, or it might take you to a
client route. It also means that on the server, if there is no client route
defined, we can send a 404 response to the client instead of loading up the
Meteor application.

## Route Parameters

Routes can have variable parameters. For example, you can create one route to
show any post with an id. The `id` is variable depending on the post you want to
see such as "/posts/1" or "/posts/2". To declare a named parameter in your route
use the `:` syntax in the url followed by the parameter name. When a user goes
to that url, the actual value of the parameter will be stored as a property on
`this.params` in your route function.

In this example we have a route parameter named `_id`. If we navigate to the
`/post/5` url in our browser, inside of the route function we can get the actual
value of the `_id` from `this.params._id`. In this case `this.params._id => 5`.

```javascript
// given a url like "/post/5"
Router.route('/post/:_id', function () {
  var params = this.params; // { _id: "5" }
  var id = params._id; // "5"
});
```

You can have multiple route parameters. In this example, we have an `_id`
parameter and a `commentId` parameter. If you navigate to the url
`/post/5/comments/100` then inside your route function `this.params._id => 5`
and `this.params.commentId => 100`.

```javascript
// given a url like "/post/5/comments/100"
Router.route('/post/:_id/comments/:commentId', function () {
  var id = this.params.id; // "5"
  var commentId = this.params.commentId; // "100"
});
```

## Rendering Templates
Usually we want to render a template when the user goes to a particular url. For
example, we might want to render the template named `Post` when the user
navigates to the url `/posts/1`.

```html
<template name="Post">
  <h1>Post: {{title}}</h1>
</template>
```

```javascript
Router.route('/post/:_id', function () {
  this.render('Post');
});
```

We can render a template by calling the `render` method inside of our route
function. The `render` method takes the name of a template as its first
parameter.

## Rendering Templates with Data
In the above example the `title` value is not defined. We could create a helper
on the Post template called `title` or we can set a data context for the
template directly from our route function. To do that, we provide a `data`
option as a second parameter to the `render` call.

```javascript
Router.route('/post/:_id', function () {
  this.render('Post', {
    data: function () {
      return Posts.findOne({_id: this.params._id});
    }
  });
});
```

## Layouts
Layouts allow you to reuse a common look and feel in multiple pages in your
application so you don't have to duplicate the html and logic on every single
page template.

Layouts are just templates. But, inside of a layout you can use a special helper
called `yield`. You can think of `yield` as a placeholder for content. The
placeholder is called a *region.* The content will be "injected" into the
region when we actually run our route.  This lets us reuse the layout on many
different pages, only changing the content of the *yield regions*.

```html
<template name="ApplicationLayout">
  <header>
    <h1>{{title}}</h1>
  </header>

  <aside>
    {{> yield "aside"}}
  </aside>

  <article>
    {{> yield}}
  </article>

  <footer>
    {{> yield "footer"}}
  </footer>
</template>
```

We can tell our route function which layout templat to use by calling the
`layout` method.

```javascript
Router.route('/post/:_id', function () {
  this.layout('ApplicationLayout');
});
```

If you want to use a default layout template for all routes you can configure a
global Router option.

```javascript
Router.configure({
  layoutTemplate: 'ApplicationLayout'
});
```

### Rendering Templates into Regions with JavaScript
Inside of our route function we can tell the router which templates to render
into each region. 

```html
<template name="Post">
  <p>
    {{post_content}}
  </p>
</template>

<template name="PostFooter">
  Some post specific footer content.
</template>

<template name="PostAside">
  Some post specific aside content.
</template>
```
Let's say we're using the `ApplicationLayout` and we want to put the templates
defined above into their respective regions for the `/post/:_id` route. We can
do this directly in our route function using the `to` option of the `render`
method.

```javascript
Router.route('/post/:_id', function () {
  // use the template named ApplicationLayout for our layout
  this.layout('ApplicationLayout');

  // render the Post template into the "main" region
  // {{> yield}}
  this.render('Post');

  // render the PostAside template into the yield region named "aside" 
  // {{> yield "aside"}}
  this.render('PostAside', {to: 'aside'});

  // render the PostFooter template into the yield region named "footer" 
  // {{> yield "footer"}}
  this.render('PostFooter', {to: 'footer'});
});
```

### Setting Region Data Contexts
You can set the data contexts for regions by providing a `data` option to the
`render` method. You can also set a data context for the entire layout.

```javascript
Router.route('/post/:_id', function () {
  this.layout('ApplicationLayout', {
    data: function () { return Posts.findOne({_id: this.params._id}) }
  });

  this.render('Post' {
    // we don't really need this since we set the data context for the
    // the entire layout above. But this demonstrates how you can set
    // a new data context for each specific region.
    data: function () { return Posts.findOne({_id: this.params._id})
  });

  this.render('PostAside', {
    to: 'aside',
    data: function () { return Posts.findOne({_id: this.params._id})
  });

  this.render('PostFooter', {
    to: 'footer',
    data: function () { return Posts.findOne({_id: this.params._id})
  });
});
```

### Rendering Templates into Regions using contentFor
Rendering templates into region from our route function can be useful,
especially if we need to run some custom logic or if the template names are
dynamic. But often an easier way to provide content for a region is to use the
`contentFor` helper directly from our main template. Let's say we're using the
same `ApplicationLayout` from the previous example. But this time, instead of
defining a new template for each region, we'll provide the content *inline* in
our `Post` template.

```html
<template name="Post">
  <p>
    {{post_content}}
  </p>

  {{#contentFor "aside"}}
    Some post specific aside content.
  {{/contentFor}}

  {{#contentFor "footer"}}
    Some post specific footer content.
  {{/contentFor}}
</template>
```

Now we can simply specify our layout and render the `Post` template instead of
each individual region.

```javascript
Router.route('/post/:_id', function () {
  this.layout('ApplicationLayout', {
    data: function () { return Posts.findOne({_id: this.params._id}) }
  });

  // this time just render the template named "Post" into the main
  // region
  this.render('Post');
});
```

You can even provide a template option to the `contentFor` helper instead of
providing inline block content.

```html
<template name="Post">
  <p>
    {{post_content}}
  </p>

  {{> contentFor region="aside" template="PostAside"}}

  {{> contentFor region="footer" template="PostFooter"}}
</template>
```

## Client Navigation
Most of the time users of your application will navigate around the app inside
the browser instead of making new requests to the server for each page. There
are a few ways to navigate around the application.

### Using Links
Users can navigate around the application by clicking links. Let's say we have a
layout with some navigation links.

```html
<template name="ApplicationLayout">
  <nav>
    <ul>
      <li>
        <a href="/">Home</a>
      </li>
      
      <li>
        <a href="/one">Page One</a>
      </li>

      <li>
        <a href="/two">Page Two</a>
      </li>
    </ul>
  </nav>

  <article>
    {{> yield}}
  </article>
</template>

<template name="Home">
  Home
</template>

<template name="PageOne">
  Page One
</template>

<template name="PageTwo">
  Page Two
</template>
```

Next, we'll define some routes for these pages.

```javascript
Router.route('/', function () {
  this.render('Home');
});

Router.route('/one', function () {
  this.render('PageOne');
});

Router.route('/two', function () {
  this.render('PageTwo');
});
```

### Using JavaScript
You can navigate to a given url, or even a route name, from JavaScript using the
`Router.go` method. Let's say we've defined a click event handler for a button.

```html
<template name="MyButton">
  <button id="clickme">Go to Page One</button>
</template>
```

In our click event handler we can tell the router to go to the `/one` url.

```javascript
Template.MyButton.events({
  'click #clickme': function () {
    Router.go('/one');
  }
});
```

This will change the browser's url to `/one` and run the corresponding route.

### Using Redirects
You can redirect from one route to another from inside a route function by using
the `redirect` method inside your route function.

```javascript
Router.route('/one', function () {
  this.redirect('/two');
});

Router.route('/two', function () {
  this.render('PageTwo');
});
```

### Using Links to Server Routes

## Path Helpers

When the application first loads at the root url `/` the first route will run
and the template named "Home" will be rendered to the page.

If the user clicks the `Page One` link, the url in the browser will change to
'/one' and the second route will run, rendering the 'PageOne' template.

Likewise, if the user clicks the `Page Two` link, the url in the browser will
change to '/two' and the third route will run, rendering the 'PageTwo' template.

Even though the url is changing in the browser, since these are client-side
routes, the browser doesn't need to make requests to the server. 


## pushState

## IE support

## links

## navigating with Router.go

## Redirecting

## Server Routing

## Navigation

## Route Dispatching and Middleware

## Route Controllers

## Hooks

## Plugins

## State with get/set and UI.controller();

## Custom Router Rendering

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
