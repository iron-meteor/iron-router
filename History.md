## v0.6.0

* **WARNING:** Breaking Changes
  * The `layout` option is now called `layoutTemplate`
  * The `renderTemplates` option is now called `yieldTemplates`
  * RouteController `onBefore..` and `onAfter..` methods removed (now just use
    `before` and `after`)
  * `Router.current()` now returns a `RouteController` instance
  * The `waitOn` option now applies to the before/after filters and your action
    method; no more to the render method
     * *NOTE: this is still being worked on a bit*
     * All before hooks, the action, and after hooks will wait
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
* PageController class for handling layout and template rendering and storing a global data context
  * Layouts and templates now only re-render if the actual template has changed (allows for maintaining a layout/template across routes with no flicker)
  * Data context is set globally on the Router
  * *Note: Still being worked on a bit*
  * across routes by default (you can override this by saying `data: false` in your route)
  * See the lib/client/page_controller.js file for details
* No more silly RouteContext; all this stuff is in the RouteController instance
* Partial support for IE8-9. Pages make a server request if pushState is not supported by the browser. This is a performance penalty, but it works
* before/after filters are now inheritable on RouteController
* before/after filters are class level methods on RouteController
* Cleaned up API signatures and passing of options from Router->Route->RouteController
* Fix onclick handler and moved into lib/client/location.js
* Client and Server Router now inherit from IronRouter
* Client and Server RouteController now inherit from IronRouterController
* Removed unnecessary global symbol exports (still accessible through Package['iron-router'] namespace)
* Client RouteController has a getData method to access the Router current data context

## v0.5.4
