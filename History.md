v1.1.2 / 2017-2-12
==================
  * Bump Iron:Url version

v1.1.0 / 2017-1-14
==================
  * Add 'noRoutesTemplate' config option
  * Clarify default page messaging

v1.0.11 / 2015-10-09
==================
  * Fix Iron-Layout for Meteor 1.2

1.0.10 / 2015-10-6
==================
  * compatibility fix for Meteor 1.2

1.0.6 / 2014-12-18
==================
  * roll back a change that resulted in re-rendering templates on every route
    change. The effect of this change is that sometimes controller helpers will
    not rerun even if the route has changed. But this is less of a problem than
    large parts of the page re-rendering.

1.0.5 / 2014-12-17
==================
  * Don't use. See note in 1.0.6

1.0.4 / 2014-12-17
==================
  * Upgrade to 1.0.6. See note in 1.0.6.
  * auto detect url scheme so you can cut and paste IE8 urls to modern browsers for example
  * correctly handle + in uri components
  * correctly handle spaces in GET queries
  * remove trailing slash between path and hash frag
  * use #! instead of # hash frag to support spiderable
  * make sure prev controller stopped before setting params
  * remove Object.keys issue causing problems in IE8
  * only instantiate controller for the correct environment
  * change "frag" to "hash" in guide example of linkTo
  * don't call out to server route if history.state.initial is true
  * implement ready() and wait() on server
  * config bodyParser which is overridable
  * mention template lookup semantics in readme...
  * Merge pull request #1120 from NestedData/devel
  * Merge pull request #1123 from zimme/name
  * Merge pull request #1124 from dburles/patch-1
  * update tom's isHandled logic to use thisArg instead of params...
  * added one semicolon
  * Add name to package.js
  * Added note about getParams
  * Merge pull request #1100 from lirbank/patch-1
  * Merge pull request #1078 from lb-/patch-1
  * Update Guide.md
  * Make static files work again
  * Minor typo in guide.md

1.0.0 / 2014-10-28
==================
  * Major refactor and cleanup
  * See the README.md for a migration guide from previous versions
  * Mostly backward compatible but a few breaking changes

v0.9.2 / 2014-08-27
==================
  * Bump iron:dynamic-template and iron:layout dependencies for Meteor 0.9.1 release
  * Fix #742 - https://github.com/EventedMind/iron-router/commit/69222246194fb630996fdb988335fed208e4caf4#commitcomment-7468636
  * Added another failing test case. For #742
  * Update README.md
  * fix waitlist onInvalidate logic
  * fix package.js to use METEOR vs METEOR-CORE in versionsFrom

v0.9.1 / 2014-08-18
=================
  * Fix waitlist to ensure ready() is correct before next flush
  * Throw error on infinite invalidation loops for waitlist
  * Fix multiple data issues
  * Make onRun only run once

v0.9.0 / 2014-08-12
==================
  * update for new package system
  * throw error for cmather:iron-router and use iron:router instead
  * remove deprecate method from utils since we have it in core

v0.8.2 / 2014-07-29
==================
  * fix subscribe(...).wait() bug

v0.8.0 / 2014-07-29
==================
  * add new waitlist from refactor
  * remove bad tests
  * change version to 0.8.0
  * add specific iron-layout version dependency in smart.json
  * Merge branch 'bug/layout-rendering' into devel
  * fix layout rendering bug with issue #724
  * add version in package.js
  * track current rendering transaction...
  * When controller stops call endRendering to stop rendering transaction.
  * add contributors to history file
  * remove build status for now will bring back later
  * update history
  * Merge branch 'devel' into feature/iron-layout
  * add history entry and fix package dep on iron-layout
  * Merge pull request #712 from aramk/patch-1
  * Used new method name in sample code.
  * layout.endRendering() returns an array of keys now
  * fix smart.json file.
  * fix clearUnusedRegions bug and add waitOn test example
  * wip - fix integrate iron-layout...
  * Finish iron-layout integration.
  * Make basic example a little more realistic.
  * Make sure we clear unused regions if the before hook pauses.
  * Added test and fix for #652
  * fix: ie9 omits leading slash in pathname on click handler
  * Added test to prove I was wrong in #689
  * Added test case and fixed #676
  * Don’t call unnecessary stop() in client router when browsing away.
  * Update route_controller.js
  * Add semicolon
  * Update DOCS.md
  * Update README.md
  * Fix test to use newController vs legacy getController.
  * Supress warnings during testing.
  * Router.configure({supressWarnings: true}) prevents warnings.
  * Correcting outdated examples in docs.md
  * Get rid of `this.stop()` !!
  * Style cleanup in server router.
  * Fix findController and tests for Route.
  * Fix findController method.
  * Merge branch 'patch-1' of github.com:dandv/iron-router into dandv-patch-1
  * Fix #562 - s/before/onBeforeAction/, same for after
  * Update .gitignore to ignore smart.lock
  * Delete smart.lock; Fixes #608
  * Sorry I forgot I'm having commit access. oops.
  * Dummy Commit
  * Clean up location file whitespace.
  * Refactor and clean up getController method on Route.
  * Merge branch 'travis-tests' of github.com:mizzao/iron-router into mizzao-travis-tests
  * Merge branch 'dev' of github.com:EventedMind/iron-router into dev
  * Bump blaze-layout version and minor pr/607 adjustments.
  * Set layout before each recomputed action; closes #600
  * Fix up route error messages and url func.
  * Remove erroneous executable permssion on js files.
  * Bump blaze-layout version and minor pr/607 adjustments.
  * Set layout before each recomputed action; closes #600
  * Fix up route error messages and url func.
  * Merge pull request #590 from dandv/patch-1
  * Remove erroneous executable permssion on js files.
  * enable automated testing on travis-ci.org
  * Update History.md
  * Update README.md
  * Mention that Router.current() is reactive
  * Integrate iron-layout for new Blaze.View work
  * Only use one main computation in _run instead of one for each thing
  * Fix clearUnusedRegion bug
  * Fix ie9 omits leading slash in pathname on click handler
  * Dont call unnecessary stop() in client router when browsing away
  * Examples corrections

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
