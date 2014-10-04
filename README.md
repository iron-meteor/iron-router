Iron.Router
==============================================================================
A router that works on the server and the browser, designed specifically for <a href="https://github.com/meteor/meteor" target="_blank">Meteor</a>

## The Iron.Router Guide
Detailed explanations of router features can be found in the <a href="https://eventedmind.github.io/iron-router" target="_blank">Guide</a>.

## Examples
There are several examples in the <a href="https://github.com/EventedMind/iron-router/tree/devel/examples" target="_blank">examples folder</a>. TODO  These examples are based on the version 1.0.0-pre

## Note
You are looking at the *devel* branch right now. This is where active development of the project happens. We will try to keep the Guide up to date with what has been released. We're trying, but mistakes happen! So if you find an issue with the docs please file an issue here on Github. Thanks :).

## Quick Start
Create some routes in a client/server JavaScript file:

```javascript
Router.route('/', function () {
  this.render('MyTemplate');
});

Router.route('/items', function () {
  this.render('Items');
});

Router.route('/items/:_id', function () {
  var item = Items.findOne({_id: this.params._id});
  this.render('ShowItem', {data: item});
});

Router.route('/files/:filename', function () {
  this.response.end('hi from the server\n');
}, {where: 'server'});

Router.route('/restful', {where: 'server'})
  .get(function () {
    this.response.end('get request\n');
  })
  .post(function () {
    this.response.end('post request\n');
  });

```

## Contributing
Contributors are very welcome. There are many things you can help with,
including finding and fixing bugs, creating examples for the examples folder,
contributing to improved design or adding features. Some guidelines below:

* **Questions**: Please post to Stack Overflow and tag with `iron-router` : http://stackoverflow.com/questions/tagged/iron-router.

* **New Features**: If you'd like to work on a feature,
  start by creating a 'Feature Design: Title' issue. This will let people bat it
  around a bit before you send a full blown pull request. Also, you can create
  an issue to discuss a design even if you won't be working on it.

* **Bugs**: If you think you found a bug, please create a "reproduction." This is a small project that demonstrates the problem as concisely as possible. The project should be cloneable from Github. Any bug reports without a reproduction that don't have an obvious solution will be marked as "awaiting-reproduction" and closed after one week. Want more information on creating reproductions? Watch this video: https://www.eventedmind.com/feed/github-issues-and-reproductions.

###  Working Locally
This is useful if you're contributing code to iron-router.

  1. Set up a local packages folder
  2. Add the PACKAGE_DIRS environment variable to your .bashrc file
    - Example: `export PACKAGE_DIRS="/Users/cmather/code/packages"`
    - Screencast: https://www.eventedmind.com/posts/meteor-versioning-and-packages
  3. Clone the repository into your local packages directory
  4. Add iron-router just like any other meteor core package like this: `meteor
     add iron:router`

```bash
> git clone https://github.com/EventedMind/iron-router.git /Users/cmather/code/packages/iron:router
> cd my-project
> meteor add iron:router
```

## License
MIT
