## v0.7.1
* Fix dataNotFoundHook
* Bump blaze-layout to 0.2.4
  * Better error message for {{yield}} vs {{> yield}}
  * Make parent data context available inside Layout when using Layout manually
* Remove Handlebars symbol from helpers.js
* Fix client helpers processArgs bug
* Don't call the data() function until controller is ready

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
  * No more getData and setData methods on RouteController instances. Just use `this.data()` to call the controller's wrapped data function.
  * run method changes
    * Changed run to _run to indicate privacy
    * A RouteController is in a running state or a stopped state. You cannot run a controller that is already running.
    * You cannot call `stop()` inside of a run. Use `pause()` for hooks now instead. see below.
    * Order of operations:
      1. Clear the waitlist
      2. Set the layout
      3. Run the onRun hooks in a computation
      4. Run the waitOn function in a computation, populating the waitlist
      5. Set the global data context using the controller's wrapped data function
      6. Run the action in a computation in this order: onBeforeAction, action, onAfterAction
  * Hook api changes
    * You can no longer call `this.stop()` in a hook. Use `pause()` instead which is the first parameter passed to the hook function. This stops downstream hooks from running. For example the loading hook uses pause() to stop the action function from rendering the main template.
    * No hooks are included in your controllers by default. If you want to add them you can do it like this:
      * `Router.onBeforeAction('loading')`
      * `Router.onBeforeAction('dataNotFound')`
    * Package authors can include their own hooks in the lookup chain by adding them to the `Router.hooks` namespace. Then users can add them by name like this: `Router.onBeforeAction('customhook');`
    * See lib/client/hooks.js for example.
    * Hooks are now called in a different order by popular demand:
      1. controller options
      2. controller prototype
      3. controller object
      4. route option hooks
      5. router global
      
* Helpers cleanup
  * `{{link}}` helper is no longer included by default. These types of helpers can be implemented in separate packages.
  * `{{renderRouter}}` is gone for now.
  * `{{pathFor}}` and `{{urlFor}}` still work with some api changes:
    * {{pathFor 'routeName' params=this query="key=value&key2=value2" hash="somehash" anotherparam="anothervalue"}}
    * same for {{urlFor}}

* IronLocation changes
  * The router now sets up the link handler for much more consistency between `Router.go` and clicks on links.
  * The location URL changes in between stopping the old route and starting the new one, so `onStop` and `onRun` behave as you'd expect.
  * `location` is now an option to configure so you can use a custom location manager (apart from IronLocation).

## v0.6.2
* Bug fix: couldn't go back after page reload. Thanks @apendua!
* Added ability to customize IronLocation link selector. Thanks @nathan-muir
* Fixed a problem with child hooks running multiple times. Thanks @jagi!
* Fixed a problem with stopping the process when redirecting
* Fixed issues with optional paths, thanks @mitar
* Fixed problem on Android 2.3



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
