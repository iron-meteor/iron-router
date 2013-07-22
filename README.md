# Iron Router

A reactive, highly customizable router that is Meteor specific -- it knows about your subscriptions, data sources and helps you take care of common problems.


## Installation

Iron Router can be installed with [Meteorite](https://github.com/oortcloud/meteorite/). From inside a Meteorite-managed app:

``` sh
$ mrt add iron-router
```

Note that Iron Router requires Meteor >= 0.7.0.

## API

### Basics

By default, Iron Router takes over rendering the body of the page. To tell it what to render, you provide a *route map*, which is a list of route names and options:

```js
Router.map(function() {
  this.route('home', {path: '/'});
  this.route('aboutUs')
});
```

By default the *name* of the route (the first argument to `this.route`) is also the name of the template to be rendered by this route. So for the code above to work, you would need a template named `home` and a template named `aboutUs`. Similarly, by default the route is rendered at `/<name>`, but you can see above, that you can override this with the `path` option.

### Basic options

 - `path`
 - `template`

### Layouts

### Path helpers

### Hooks

### Configuration



## Controllers


## Server Side Routing



## Examples

## Contributing