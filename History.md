## v0.7.0
* Blaze rendering with the [blaze-layout](https://github.com/eventedmind/blaze-layout) package.
  * Layouts are only taken off the DOM (re-rendered) if the layout changes.
  * Templates are only taken off the DOM (re-rendered) if the template changes.
  * Data contexts change independently from rendering.
  * {{yield}} is now {{> yield}} and {{yield 'footer'}} is now {{> yield region='footer'}}
  * {{#contentFor region='footer'}}footer content goes here{{/contentFor}} is supported again!
  * Router supports a uiManager api that can be used to plug in other ui managers (in addition to blaze-layout)
* RouteController API cleanup
  * Hook name changes (legacy supported until 1.0)
    * before -> onBeforeAction
    * after -> onAfterAction
    * load -> onRun
    * unload -> onStop
  * run changed to _run to indicate privacy and semantic changes
    * A RouteController is in a running state or a stopped state. You cannot run a controller that is already running.
    * You cannot call `stop()` inside of a run. Use `pause()` for hooks now instead. see below.
    * Order of operations:
      1. Clear the waitlist
      2. Set the layout
      3. Run the onRun hooks in a computation
      4. Run the waitOn function in a computation, populating the waitlist
      5. Set the global data context using the controller's wrapped data function
      6. Run the action in a computation in this order: onBeforeAction, action, onAfterAction


## v0.6.2
* Bug fix: couldn't go back after page reload. Thanks @apendua!

## v0.6.1
* Bug fix: notFound template rendered with layout
* Bug fix: loading and notFound render yeilds again
* Bug fix: IE8 issue with 'class' property name on link handlebars helper
* Bug fix: Global hook regression
* Readme fixes

## v0.6.0
* **WARNING:** Breaking Changes
  * The `layout` option is now called `layoutTemplate`
  * The `renderTemplates` option is now called `yieldTemplates`
  * RouteController `onBefore..` and `onAfter..` methods removed (now just use
    `before` and `after`)
  * `Router.current()` now returns a `RouteController` instance
  * data option now applies only to the Route or RouteController, not to the render method
  * pathFor and urlFor semantics have changed slightly (hash and query params can now be the key value pairs of the Handlebars expression)
    1. `{{pathFor contextObject queryKey=queryValue hash=anchorTag}}`
    or
    2. ```
        {{#with contextObject}} 
          {{pathFor queryKey=queryValue hash=anchorTag}}
        {{/with}}
       ```

* Route and RouteController level layouts
* Support for url hash fragments
* Better support for query string parameters
* PageManager class for handling layout and template rendering and storing a global data context
  * Layouts and templates now only re-render if the actual template has changed (allows for maintaining a layout/template across routes with no flicker)
  * Data context is set/get globally on/from the Router
  * See the lib/client/page_controller.js file for details
* No more silly RouteContext; all this stuff is in the RouteController instance
* Partial support for IE8-9. Pages make a server request if pushState is not supported by the browser. This is a performance penalty, but it works
* Cleaned up API signatures and passing of options from Router->Route->RouteController
* Fix onclick handler and moved into lib/client/location.js
* Client and Server Router now inherit from IronRouter
* Client and Server RouteController now inherit from IronRouterController
* Removed unnecessary global symbol exports (still accessible through Package['iron-router'] namespace)
* Global `notFoundTemplate` will render if a route is not found.
* Added `load` hook which fires exactly once per route load (and respects hot-code-reload!)
* Added `Router.before()` and friends which let you add global hooks with a bit more subtlety.

## v0.5.4
