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

A *layout* is simply a template which specifies one or more *yields* which the router can render templates into.
For example, the following layout has two named yields (`sidebar` and `footer`) in addition to the main yield.

```handlebars
 <template name="layout">
   <aside>
     {{yield 'sidebar'}}
   </aside>

   <nav>
     <ul>
       <!-- navigation links here>
     </ul>
   </nav>

   {{{yield}}}

   <footer>
     {{yield 'footer'}}
   </footer>
 </template>
```

The layout enables a route to render multiple templates in addition to the main template. You don't have to use a layout: if none is specified, the router just uses a default layout which contains the only the main yield and no other named yields.

For more information about configuring the layout, see the configuration section below. Named yields can be configured globally, but also at the the controller level.

### Path helpers

### Hooks

## Configuration

Configuration of Iron Router is hierarchical: settings flow from the global configuration to routes and finally to route controllers. When rendering a particular route, the router looks for appropriate settings in reverse order of the above, so you can override settings by setting specific options on routes and controllers.

### Global

To set up a general layout for the router, you do something like the following. This will render the template with the name `sidebar` to all yields named `sidebar` and so on for `footer`, using the template called `layout`.

```javascript
Router.configure({
  layout: 'layout',
  renderTemplates: {
    'footer': {
      to: 'footer'
    },
    'sidebar': {
      to: 'sidebar'
    }
  }
});
```

### Routes

### Controllers

Controllers allow more fine-grained control over how routes are rendered. They allow you to specify additional options as well as control the rendering process.

You don't have to specify a controller to render a route. Iron Router will look for controllers in a smart way, and create one for a route if none exists.

## Server Side Routing

## Coffeescript Support

Iron router has very good support for coffeescript. The inheritance model for RouteControllers is the same as that of Coffeescript itself, so you can define new controllers in a very intuitive way:

```coffeescript
class @PostController extends RouteController
    template: 'post'

    renderTemplates:
      'sidebar': to: 'sidebar'
      'footer': to: 'footer'

    data: ->
      title: 'Hello World'

    run: ->
      console.log 'running'
      super
```

The above controller is created in the global namespace with the use of `@`, and will be automatically used to render the route called `/post`.

## Examples

- Basic example in CoffeeScript: https://github.com/cmather/iron-router-coffeescript-example

## Contributing
