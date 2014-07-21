# Iron.Router

A router that works on the server and the browser, designed specifically for
[Meteor](https://github.com/meteor/meteor).

**Table of Contents**

- [Quick Start](#quick-start)

Notes
- Quickstart
  - installing
  - creating some routes
- Layouts, yield, contentFor, setting layouts dynamically, etc.
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
