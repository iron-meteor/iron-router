## v0.6.0

* **WARNING:** Breaking Changes
  * The `layout` option is now called `layoutTemplate`
  * RouteController `onBefore..` and `onAfter..` methods removed (now just use
    `before` and `after`)
  * `Router.current()` now returns a `RouteController` instance
  * The `waitOn` option now applies to the before/after filters and your action
    method; no more just to the render method
  * pathFor and urlFor semantics have changed:
    1. `{{pathFor contextObject queryKey=queryValue hash=anchorTag}}`
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
  * Data context is maintained across routes by default
  * See the lib/client/page_controller.js file for details
* No more silly RouteContext; all this stuff is in the RouteController instance
* Partial support for IE8-9. Pages make a server request if pushState is not supported by the browser. This is a performance penalty, but it works
* before/after filters are now inheritable on RouteController
* before/after filters are class level methods on RouteController
* Cleaned up API signatures and passing of options from Router->Route->RouteController
* Fix onclick handler and moved into lib/client/location.js

## v0.5.4
