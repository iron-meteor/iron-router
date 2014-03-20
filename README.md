# Iron Router

A client and server side router designed specifically for Meteor.


## History

**Latest Version:** 0.6.1

See the History.md file for changes (including breaking changes) across
versions.

## About

Iron Router is a *routing* package for Meteor. It makes single page apps.

IR takes control of your `<body>` tag, rendering templates based on the user's current URL. It also helps you set up subscriptions per-route and much more.

Iron Router works with Meteor 0.8.0 and above. To use an earlier version, use a version of IR less than 0.7.0.

##  Installation

Iron Router can be installed with [Meteorite](https://github.com/oortcloud/meteorite/). From inside a Meteorite-managed app:

``` sh
$ mrt add iron-router
```

## API

### Basics

#### Declaring a route

You place your route declarations in a `Router.map` block: 

```
Router.map(function() {
  this.add('home', {path: '/'})
  this.add('about');
});
```

The first route is named `home`, and will render a template named `home` at the path `/`. The second is named `about`, and will render a template named `about` at the path `/about`.

You should define your routes in a file common to the client and server so both contexts can use them.

#### Using routes

XXX: how to get the helpers?
To use a route in your app, you can use the `{{pathFor}}` handlebars helper:

```
  <a href="{{pathFor 'home'}}">Go home!</a>
```

Or, call `Router.path('home)` to get it as a string.

The router will pick up internal clicks on links to routes. 
Alternatively, you can directly call `Router.go()` in a event handler:

```
  Template.foo.events({
    'click .homeLink': function() {
      Router.go('home');
    }
  });
```

#### Path segments


#### Controlling subscriptions


### Advanced

#### Route options

#### Queries and Hashes

#### Custom actions and hooks

#### Server routing

#### Route Controllers


### More

For full details see the [Docs](DOCS.md)

## Contributing

Contributors are very welcome. There are many things you can help with,
including finding and fixing bugs, creating examples for the examples folder,
contributing to improved design or adding features. Some guidelines below:

* **Questions**: For now, it's okay to ask a question on Github Issues if you're
  having trouble since the volume is manageable. This might change if it starts
  to overshadow development! Just prefix your Github Issue with 'Question: ' so
  we can differentiate easily. Also, please make sure you've read through this
  document and tried a few things before asking. This way you can be very
  specific in your question. Also, please provide a cloneable Github repository
  if the issue is complex. For more complex questions sometimes it's hard to get all of the context
  required to solve a problem by just looking at text.

* **New Features**: If you'd like to work on a feature for the iron-router,
  start by creating a 'Feature Design: Title' issue. This will let people bat it
  around a bit before you send a full blown pull request. Also, you can create
  an issue to discuss a design even if you won't be working on it. Any
  collaboration is good! But please be patient :-).

* **Bugs**: If you find a bug and it's non-obvious what's causing it (almost
  always) please provide a reproduction Github project and give some context
  around the bug. Pasting in a snippet of JavaScript probably won't be enough.

* **Answer Questions!**: If you can help another user please do!

#### Local installation

  This is useful if you're working off of the dev branch or contributing.

  1. Set up a local packages folder
  2. Add the PACKAGE_DIRS environment variable to your .bashrc file
    - Example: `export PACKAGE_DIRS="/Users/cmather/code/packages"`
    - Screencast: https://www.eventedmind.com/posts/meteor-versioning-and-packages
  3. Clone the repository into your local packages directory
  4. Add iron-router just like any other meteor core package like this: `meteor
     add iron-router`

  ```sh
  $ git clone https://github.com/EventedMind/iron-router.git /Users/cmather/code/packages
  $ cd my-project
  $ meteor add iron-router
  ```

## License

MIT
