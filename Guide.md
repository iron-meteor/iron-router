# Iron.Router

A router that works on the server and the browser, designed specifically for
[Meteor](https://github.com/meteor/meteor).


## Quick Start
You can install iron:router using Meteor's package management system:

```bash
> meteor add iron:router
```

To update iron:router to the latest version you can use the `meteor update`
command:

```bash
> meteor update iron:router
```

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
we can also create server routes. These hook directly into the HTTP request and
are used to implement REST endpoints.

```javascript
Router.route('/item', function () {
  var req = this.request;
  var res = this.response;
  res.end('hello from the server\n');
}, {where: 'server'});
```

The `where: 'server'` option tells the Router this is a server side route.

## Table of Contents

- [Concepts](#concepts)
  - [Server Only](#server-only)
  - [Client Only](#client-only)
  - [Client and Server](#client-and-server)
  - [Reactivity](#reactivity)
- [Route Parameters](#route-parameters)
- [Rendering Templates](#rendering-templates)
- [Rendering Templates with Data](#rendering-templates-with-data)
- [Layouts](#layouts)
  - [Rendering Templates into Regions with JavaScript](#rendering-templates-into-regions-with-javascript)
  - [Setting Region Data Contexts](#setting-region-data-contexts)
  - [Rendering Templates into Regions using contentFor](#rendering-templates-into-regions-using-contentfor)
- [Client Navigation](#client-navigation)
  - [Using Links](#using-links)
  - [Using JavaScript](#using-javascript)
  - [Using Redirects](#using-redirects)
  - [Using Links to Server Routes](#using-links-to-server-routes)
- [Named Routes](#named-routes)
  - [Getting the Current Route](#getting-the-current-route)
- [Template Lookup](#template-lookup)
- [Path and Link Template Helpers](#path-and-link-template-helpers)
  - [pathFor](#pathfor)
  - [urlFor](#urlfor)
  - [linkTo](#linkto)
- [Route Options](#route-options)
  - [Route Specific Options](#route-specific-options)
  - [Global Default Options](#global-default-options)
- [Subscriptions](#subscriptions)
  - [Wait and Ready](#wait-and-ready)
  - [The subscriptions Option](#the-subscriptions-option)
  - [The waitOn Option](#the-waiton-option)
- [Server Routing](#server-routing)
  - [Creating Routes](#creating-routes)
  - [Restful Routes](#restful-routes)
  - [404s and Client vs Server Routes](#404s-and-client-vs-server-routes)
- [Plugins](#plugins)
  - [Creating Plugins](#creating-plugins)
- [Hooks](#hooks)
  - [Using Hooks](#using-hooks)
  - [Applying Hooks to Specific Routes](#applying-hooks-to-specific-routes)
  - [Using the Iron.Router.hooks Namespace](#using-the-ironrouterhooks-namespace)
  - [Available Hook Methods](#available-hook-methods)
- [Route Controllers](#route-controllers)
  - [Creating Route Controllers](#creating-route-controllers)
  - [Inheriting from Route Controllers](#inheriting-from-route-controllers)
  - [Accessing the Current Route Controller](#accessing-the-current-route-controller)
  - [Setting Reactive State Variables](#setting-reactive-state-variables)
  - [Getting Reactive State Variables](#getting-reactive-state-variables)
- [Custom Router Rendering](#custom-router-rendering)
- [Legacy Browser Support](#legacy-browser-support)

## Concepts

### Server Only
In a typical Web app, you make an http request to a server at a particular url,
like "/items/5", and a router on the server decides which function to invoke for
that particular route. The function will most likely send some html back to the
browser and close the connection.

### Client Only
In some more modern Web apps you'll use a "client side" router like pagejs or
Backbone router. These routers run in the browser, and let you navigate around
an application without making trips to the server by taking advantage of browser
HTML5 features like pushState or url hash fragments.

### Client and Server
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

### Reactivity
Your route functions and most hooks are run in a reactive computation. This
means they will rerun automatically if a reactive data source changes. For
example, if you call `Meteor.user()` inside of your route function, your route
function will rerun each time the value of `Meteor.user()` changes.

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
  var id = this.params._id; // "5"
  var commentId = this.params.commentId; // "100"
});
```

If there is a query string or hash fragment in the url, you can access those
using the `query` and `hash` properties of the `this.params` object.

```javascript
// given the url: "/post/5?q=s#hashFrag"
Router.route('/post/:_id', function () {
  var id = this.params._id;
  var query = this.params.query;

  // query.q -> "s"
  var hash = this.params.hash; // "hashFrag"
});
```

**Note**: If you want to rerun a function when the hash changes you can do this:

```javascript
// get a handle for the controller.
// in a template helper this would be
// var controller = Iron.controller();
var controller = this;

// reactive getParams method which will invalidate the comp if any part of the params change
// including the hash.
var params = controller.getParams();
```

By default the router will follow normal browser behavior. If you click a link with a hash frag it will scroll to an element with that id. If you want to use `controller.getParams()` you can put that in either your own autorun if you want to do something procedural, or in a helper.

## Rendering Templates
Usually we want to render a template when the user goes to a particular url. For
example, we might want to render the template named `Post` when the user
navigates to the url `/posts/1`.

```handlebars
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
If you wish to return access to more that one `Post` from the route, the
`data` option should return an object containing a cursor.

```javascript
Router.route('/post/:_id', function () {
  this.render('Post', {
    data: {
      posts: Posts.find();
    }
  });
});
```

Too access the `title` of each `Post`, use the `#each` helper in the template.

```handlebars
<template name="Post">
  {{#each posts}}
  <h1>Post: {{title}}</h1>
  {{/each}}
</template>
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

```handlebars
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

We can tell our route function which layout template to use by calling the
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

```handlebars
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

  this.render('Post', {
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

```handlebars
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
providing in-line block content.

```handlebars
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

```handlebars
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
When the application first loads at the root url `/` the first route will run
and the template named "Home" will be rendered to the page.

If the user clicks the `Page One` link, the url in the browser will change to
'/one' and the second route will run, rendering the 'PageOne' template.

Likewise, if the user clicks the `Page Two` link, the url in the browser will
change to '/two' and the third route will run, rendering the 'PageTwo' template.

Even though the url is changing in the browser, since these are client-side
routes, the browser doesn't need to make requests to the server.

### Using JavaScript
You can navigate to a given url, or even a route name, from JavaScript using the
`Router.go` method. Let's say we've defined a click event handler for a button.

```handlebars
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
Let's say you have a server route that you'd like to link to. For example, a
file download route which *has* to go to the server.

```javascript
Router.route('/download/:filename', function () {
  this.response.end('some file content\n');
}, {where: 'server'});
```

Now, in our html we'll have a link to download a particular file.

```handlebars
<a href="/download/myfilename">Download File</a>
```

When a user clicks on the `Download File` link, the router will send you to the
server and run the server-side route.

## Named Routes
Routes can have names that can be used to refer to the route. If you don't give
it a name, the router will guess its name based on the path. But you can provide
a name explicitly using the `name` option.

```javascript
Router.route('/posts/:_id', function () {
  this.render('Post');
}, {
  name: 'post.show'
});
```

Now that we've named our route, we can get access to the route object if needed
like this:

```javascript
Router.routes['post.show']
```

But we can also use the route name in the `Router.go` method like this:

```javascript
Router.go('post.show');
```

Now that we're using named routes in `Router.go` you can also pass a parameters
object, query and hash fragment options.

```javascript
Router.go('post.show', {_id: 1}, {query: 'q=s', hash: 'hashFrag'});
```

The above JavaScript will navigate to this url:

```handlebars
/post/1?q=s#hashFrag
```
### Getting the Current Route

You can access the current route's name through the current controller with:

```javascript
Router.current().route.getName()
```

## Template Lookup
If you don't explicitly set a template option on your route, and you don't
explicity render a template name, the router will try to automatically render a
template based on the name of the route. By default the router will look for the
class case name of the template.

For example, if you have a route defined like this:

```javascript
Router.route('/items/:_id', {name: 'items.show'});
```

The router will by default look for a template named `ItemsShow` with capital
letters for each word and punctuation removed. If you would like to customize
this behavior you can set your own converter function. For example, let's say
you don't want any conversion. You can set the converter function like this:

```javascript
Router.setTemplateNameConverter(function (str) { return str; });
```

## Path and Link Template Helpers

### pathFor
There are a few template helpers we can use to create links based on routes.
First, we can use the `{{pathFor}}` helper to generate a path for a given named
route. Given the `post.show` route we created above we can create a link like
this:

```handlebars
{{#with post}}
  <a href="{{pathFor route='post.show'}}">Post Show</a>
{{/with}}
```

Assuming we have a post with an id of "1", the above snippet is equivalent to:

```handlebars
<a href="/posts/1">Post Show</a>
```

We can pass `data`, `query` and `hash` options to the pathFor helper.

```handlebars
<a href="{{pathFor route='post.show' data=getPost query='q=s' hash='frag'}}">Post Show</a>
```

The data object will be interpolated onto the route parameters. The query and
hash arguments will be added to the href as a query string and hash fragment.
Let's say our data object looks like this:

```javascript
data = { _id: 1 };
```

The above `pathFor` expression will result in a link that looks like this:

```handlebars
<a href="/post/1?q=s#frag">Post Show</a>
```

The benefit of using the `pathFor` helper is that we don't need to keep hard
coded `href` attributes all over the application.


### urlFor
While the `pathFor` helper generates a path for the given route, `urlFor` will
generate a fully qualified url. For example, `pathFor` might generate a path
that looks like `/posts/1` but `urlFor` would generate
`http://mysite.com/posts/1`.

### linkTo
The `linkTo` helper automatically generates the html for an anchor tag along
with the route path for the given route, parameters, hash and query. You can
even provide a block of content to be used inside the link.

```handlebars
{{#linkTo route="post.show" data=getData query="q=s" hash="hashFrag" class="my-cls"}}
  <span style="color: orange;">
    Post Show
  </span>
{{/linkTo}}
```

The expression above will be transformed into html that looks like this:

```handlebars
<a href="/posts/1?q=s#hashFrag" class="my-cls">
  <span style="color: orange;">
    Post Show
  </span>
</a>
```

## Route Options
So far you've seen a few options you can provide to routes like the `name`
option. There are a few other options and several ways to provide options to
routes.

### Route Specific Options
In this example we'll omit the route function and just provide an options
object. The options object will explain each of the possible options.

```javascript
Router.route('/post/:_id', {
  // The name of the route.
  // Used to reference the route in path helpers and to find a default template
  // for the route if none is provided in the "template" option. If no name is
  // provided, the router guesses a name based on the path '/post/:_id'
  name: 'post.show',

  // To support legacy versions of Iron.Router you can provide an explicit path
  // as an option, in case the first parameter is actually a route name.
  // However, it is recommended to provide the path as the first parameter of the
  // route function.
  path: '/post/:_id',

  // If we want to provide a specific RouteController instead of an anonymous
  // one we can do that here. See the Route Controller section for more info.
  controller: 'CustomController',

  // If the template name is different from the route name you can specify it
  // explicitly here.
  template: 'Post',

  // A layout template to be used with this route.
  // If there is no layout provided, a default layout will
  // be used.
  layoutTemplate: 'ApplicationLayout',

  // A declarative way of providing templates for each yield region
  // in the layout
  yieldRegions: {
    'MyAside': {to: 'aside'},
    'MyFooter': {to: 'footer'}
  },

  // a place to put your subscriptions
  subscriptions: function() {
    this.subscribe('items');

    // add the subscription to the waitlist
    this.subscribe('item', this.params._id).wait();
  },

  // Subscriptions or other things we want to "wait" on. This also
  // automatically uses the loading hook. That's the only difference between
  // this option and the subscriptions option above.
  waitOn: function () {
    return Meteor.subscribe('post', this.params._id);
  },

  // A data function that can be used to automatically set the data context for
  // our layout. This function can also be used by hooks and plugins. For
  // example, the "dataNotFound" plugin calls this function to see if it
  // returns a null value, and if so, renders the not found template.
  data: function () {
    return Posts.findOne({_id: this.params._id});
  },

  // You can provide any of the hook options described below in the "Using
  // Hooks" section.
  onRun: function () {},
  onRerun: function () {},
  onBeforeAction: function () {},
  onAfterAction: function () {},
  onStop: function () {},

  // The same thing as providing a function as the second parameter. You can
  // also provide a string action name here which will be looked up on a Controller
  // when the route runs. More on Controllers later. Note, the action function
  // is optional. By default a route will render its template, layout and
  // regions automatically.
  // Example:
  //  action: 'myActionFunction'
  action: function () {
    // render all templates and regions for this route
    this.render();
  }
});
```

### Global Default Options
You can set any of the above options on the Router itself. These become default
options for all of our routes. To set default Router options use the `configure`
method.

```javascript
Router.configure({
  layoutTemplate: 'ApplicationLayout',

  template: 'DefaultTemplate',

  notFoundTemplate: 'RouteNotFound',

  noRoutesTemplate: 'ReplacesSplashScreen'
});
```

Options declared on the route will override these default Router options.

## Subscriptions
Sometimes you want to wait on one or more subscriptions to be ready, or maybe
on the result of some other action. For example, you might want to show a
loading template while waiting for subscription data.

### Wait and Ready

You can use the `wait` method to add a subscription to the wait list. When you
call `this.ready()` it returns true if all items in the wait list are ready.

```javascript
Router.route('/post/:_id', function () {
  // add the subscription handle to our waitlist
  this.wait(Meteor.subscribe('item', this.params._id));

  // this.ready() is true if all items in the wait list are ready

  if (this.ready()) {
    this.render();
  } else {
    this.render('Loading');
  }
});
```

An alternative way to write the above example is to call the `wait` method
on the subscription directly. In this case you'll call `this.subscribe` instead
of `Meteor.subscribe`.

```javascript
Router.route('/post/:_id', function () {
  this.subscribe('item', this.params._id).wait();

  if (this.ready()) {
    this.render();
  } else {
    this.render('Loading');
  }
});
```

### The subscriptions Option

You can automatically take advantage of this functionality by using the `subscriptions` option to your route.

```javascript
Router.route('/post/:_id', {
  subscriptions: function() {
    // returning a subscription handle or an array of subscription handles
    // adds them to the wait list.
    return Meteor.subscribe('item', this.params._id);
  },

  action: function () {
    if (this.ready()) {
      this.render();
    } else {
      this.render('Loading');
    }
  }
});
```

Your `subscriptions` function can return a single subscription handle (the result of `Meteor.subscribe`) or an array of them. The subscription(s) will be used to drive the `.ready()` state.

You can also inherit subscriptions from the global router config or from a controller (see below).

### The waitOn Option
Another alternative is to use `waitOn` instead of `subscribe`. This has the same effect but automatically short-circuits your route action and any before hooks (see below), and renders a `loadingTemplate` instead. You can specify that template on the route or the router itself:

```javascript
Router.route('/post/:_id', {
  // this template will be rendered until the subscriptions are ready
  loadingTemplate: 'loading',

  waitOn: function () {
    // return one handle, a function, or an array
    return Meteor.subscribe('post', this.params._id);
  },

  action: function () {
    this.render('myTemplate');
  }
});
```

## Server Routing

### Creating Routes
So far you've seen features mostly intended for the browser. But you can also
create server routes with full access to the NodeJS request and response
objects. To create a server route you provide the `where: 'server'` option to
the route.

```javascript
Router.route('/download/:file', function () {
  // NodeJS request object
  var request = this.request;

  // NodeJS  response object
  var response = this.response;

  this.response.end('file download content\n');
}, {where: 'server'});
```

### Restful Routes
You can even create server-side restful routes which correspond to an http verb.
This is particularly useful if you're setting up a webhook for another service
to post data to.

```javascript
Router.route('/webhooks/stripe', { where: 'server' })
  .get(function () {
    // GET /webhooks/stripe
  })
  .post(function () {
    // POST /webhooks/stripe
  })
  .put(function () {
    // PUT /webhooks/stripe
  })
```

### 404s and Client vs Server Routes
When you initially navigate to your Meteor application's url, the server router
will see if there are any routes defined for that url, either on the server or
on the client. If no routes are found, the server will send a 404 http status
code to indicate no resource was found for the given url.

## Plugins
Plugins are a way to reuse functionality in your router, either that you've
built for your own applications, or from other package authors. There's even a
built-in plugin called "dataNotFound".

To use a plugin just call the `plugin` method of Router and pass the name of the
plugin and any options for the plugin.

```javascript
Router.plugin('dataNotFound', {notFoundTemplate: 'notFound'});
```

This out-of-box plugin will automatically render the template named "notFound"
if the route's data is falsey (i.e. `! this.data()`).

### Applying Plugins to Specific Routes
You can apply a plugin to a specific route by passing an `except` or `only` option
to the respective plugin function. This is useful for server routes, where you
explicitly don't want to run plugins designed for the client.

```javascript
Router.plugin('dataNotFound', {
  notFoundTemplate: 'NotFound',
  except: ['server.route']
  // or only: ['routeOne', 'routeTwo']
});
```

In the above example, the dataNotFound will be applied to all routes except the
route named 'server.route'.

### Creating Plugins
To create a plugin just put your function on the `Iron.Router.plugins` object
like this:

```javascript
Iron.Router.plugins.loading = function (router, options) {
  // this loading plugin just creates an onBeforeAction hook
  router.onBeforeAction('loading', options);
};
```
The plugin function will get called with the router instance and any options the
user passed.

*Package authors are encouraged to create new plugins!*

## Hooks

### Using Hooks
A hook is just a function. Hooks provide a way to plug into the process of
running a route, typically to customize rendering behavior or perform some
business logic.

In this example, our goal is to only render the template and regions for a route
if the user is logged in. We'll add a hook function using the `onBeforeAction`
method to tell the router we want this function to run before our route
function, or the "action" function.

```javascript
Router.onBeforeAction(function () {
  // all properties available in the route function
  // are also available here such as this.params

  if (!Meteor.userId()) {
    // if the user is not logged in, render the Login template
    this.render('Login');
  } else {
    // otherwise don't hold up the rest of hooks or our route/action function
    // from running
    this.next();
  }
});
```

Now let's say we have a route defined like this:

```javascript
Router.route('/admin', function () {
  this.render('AdminPage');
});
```

Our onBeforeAction hook function will run before our route function when the
user navigates to "/admin". If the user is not logged in, the route function
will never get called and the `AdminPage` will not render to the page.

Hook functions and all functions that get run when dispatching to a route are
run in a **reactive computation**: they will rerun if any reactive data sources
invalidate the computation. In the above example, if `Meteor.user()` changes the
entire set of route functions will be run again.

### Applying Hooks to Specific Routes
You can apply a hook to a specific route by passing an `except` or `only` option
to the respective hook function.

```javascript
Router.onBeforeAction(myAdminHookFunction, {
  only: ['admin']
  // or except: ['routeOne', 'routeTwo']
});
```

In the above example, the myAdminHookFunction will only get applied to a route
named 'admin.'

### Using the Iron.Router.hooks Namespace
Package authors can add hook functions to `Iron.Router.hooks` and users can
reference those hooks by string name.

```javascript
Iron.Router.hooks.customPackageHook = function () {
  console.log('hi');
  this.next();
};

Router.onBeforeAction('customPackageHook');
```
### Available Hook Methods
* **onRun**: Called when the route is first run. It is not called again if the
  route reruns because of a computation invalidation. This makes it a good
  candidate for things like analytics where you want be sure the hook only runs once. Note that this hook *won't* run again if the route is reloaded via hot code push. You *must* call `this.next()` to continue calling the next function.

* **onRerun**: Called if the route reruns because its computation is
  invalidated. Similarly to `onBeforeAction`, if you want to continue calling the next function, you
  *must* call `this.next()`.

* **onBeforeAction**: Called before the route or "action" function is run. These
  hooks behave specially. If you want to continue calling the next function you
  *must* call `this.next()`. If you don't, downstream onBeforeAction hooks and
  your action function will *not* be called.

* **onAfterAction**: Called after your route/action function has run or had a
  chance to run. These hooks behave like normal hooks and you don't need to call
  `this.next()` to move from one to the next.

* **onStop**: Called when the route is stopped, typically right before a new
  route is run.


### Server Hooks and Connect

On the server, the API signature for a `onBeforeAction` hook is identical to that of a [connect](https://github.com/senchalabs/connect) middleware:

```javascript
Router.onBeforeAction(function(req, res, next) {
  // in here next() is equivalent to this.next();
}, {where: 'server'});
```

This means you can attach any connect middleware you like on the server side using `Router.onBeforeAction()`. For convience, IR makes express' [body-parser](https://github.com/expressjs/body-parser) available at `Iron.Router.bodyParser`.

The Router attaches the JSON body parser automatically.

## Route Controllers
An `Iron.RouteController` object is created when the Router handles a url
change. The `RouteController` gives us a place to store state as we run the
route, and persists until another route is run.

We've been calling a few methods inside of our route functions like
`this.render()` and `this.layout()`. The `this` object inside of these functions
is actually an instance of a `RouteController`. If you're building a simple
application you probably don't need to worry about `RouteController`. But if
your application gets larger, using `RouteControllers` directly offers two key
benefits:

* **Inheritance**: You can inherit from other RouteControllers to model your
  application's behavior.
* **Organization**: You can begin to separate your route logic into
  RouteController files instead of putting all of your complex business logic
  into one big route file.

### Creating Route Controllers
You can create a custom `RouteController` like this:

```javascript
PostController = RouteController.extend();
```

When you define a route, you can specify a controller to use, or the router will
try to find a controller automatically based on the name of the route.

```javascript
Router.route('/post/:_id', {
  name: 'post'
});
```

The route defined above will automatically use the `PostController` using the
name of the route. We can tell the route to use a different controller by
providing a controller option.

```javascript
Router.route('/post/:_id', {
  name: 'post.show',
  controller: 'CustomController'
});
```

We can use all of the same options from our routes on our `RouteControllers`.

```javascript
PostController = RouteController.extend({
  layoutTemplate: 'PostLayout',

  template: 'Post',

  waitOn: function () { return Meteor.subscribe('post', this.params._id); },

  data: function () { return Posts.findOne({_id: this.params._id}) },

  action: function () {
    this.render();
  }
});
```

We might have some options defined globally with `Router.configure`, some
options defined on the `Route` and some options defined on the
`RouteController`. Iron.Router looks up options in this order:

1. Route
2. RouteController
3. Router

### Inheriting from Route Controllers
RouteControllers can inherit from other RouteControllers. This enables some
interesting organization schemes for your application.

Let's say we have an `ApplicationController` which we want to use as the default
controller for all routes.

```javascript
ApplicationController = RouteController.extend({
  layoutTemplate: 'ApplicationLayout',

  onBeforeAction: function () {
    // do some login checks or other custom logic
    this.next();
  }
});

Router.configure({
  // this will be the default controller
  controller: 'ApplicationController'
});

// now we have a route for posts
Router.route('/posts/:_id', {
  name: 'post'
});

// inherit from `ApplicationController` and override any
// behavior you'd like.
PostController = ApplicationController.extend({
  layoutTemplate: 'PostLayout'
});
```

*NOTE: This is currently a bit tricky with Meteor since you can't precisely
control file load order. You need to make sure parent RouteControllers are
evaluated before child RouteControllers.*

### Accessing the Current Route Controller
There are two ways to access the current `RouteController`.

If you're on the client, you can use the `Router.current()` method. This will
reactively return the current instance of a `RouteController`. Keep in mind this
value could be `null` if no route has run yet.

You can also access the current `RouteController` from inside your template
helpers by using the `Iron.controller()` method.

```javascript
Router.route('/posts', function () {
  this.render('Posts');
});
```

This route will render the `Posts` template defined below.

```handlebars
<template name="Posts">
  Posts
</template>
```

Now let's say we want to access the current controller from a template helper
defined on the `Posts` template.

```javascript
Template.Posts.helpers({
  myHelper: function () {
    var controller = Iron.controller();

    // now we can get properties and call methods on the controller
  }
});
```

### Setting Reactive State Variables
You can set reactive state variables on controllers using the `set` method on
the controller's [ReactiveDict](https://atmospherejs.com/meteor/reactive-dict) `state`.

Let's say we want to store the post `_id` in a reactive variable:

```javascript
Router.route('/posts/:_id', {name: 'post'});

PostController = RouteController.extend({
  action: function () {
    // set the reactive state variable "postId" with a value
    // of the id from our url
    this.state.set('postId', this.params._id);
    this.render();
  }
});
```

### Getting Reactive State Variables
You can get a reactive variable value by calling `this.state.get("key")` on the
`RouteController`. Using the example above, let's grab the value of `postId`
from a template helper.

```javascript
Template.Post.helpers({
  postId: function () {
    var controller = Iron.controller();

    // reactively return the value of postId
    return controller.state.get('postId');
  }
});
```

## Custom Router Rendering
So far we've been letting the Router render itself to the page automatically.
But you can also control precisely where the Router renders itself by using a
global helper method.

```handlebars
<body>
  <h1>Some App Html</h1>
  <div class="container">
    {{! Render the router into this div instead of the body}}
    {{> Router}}
  </div>
</body>
```

## Legacy Browser Support
Legacy browsers do not support the HTML5 `pushState` and `history` features
required for normal client side browsing with the `Router`. To solve this
problem, the `Router` can fall back to using hash fragments in the url.
Actually, under the hood, `iron-router` uses a package called `iron-location`
which handles all of this. It works similarly to the `History.js` project but
works seamlessly.

This functionality is automatically enabled for **IE8** and **IE9**. If you want
to enable it manually to play around you can configure `Iron.Location` like
this:

```javascript
Iron.Location.configure({useHashPaths: true});
```

Even though the url will appear differently in the browser when using this mode,
the url, query, hash and parameters will look like their regular values inside
of `RouteController` functions. Here are a few examples of how urls will be
translated.

```bash
http://localhost:3000/items/5?q=s#hashFrag
```

The url above would be transformed to the url below in your browser.

```bash
http://localhost:3000/#/items/5?q=s&__hash__=hashFrag
```

But in your `RouteController` functions you can access the url, query and hash
values just like you have before.

```javascript
Router.route('/items/:_id', function () {
  var id = this.params._id; // "5"
  var query = this.params.query; // {q: "s"}
  var hash = this.params.hash; // "hashFrag"
});
```

**NOTE: Please let us know if you can help test support on other browsers!**
