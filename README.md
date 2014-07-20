Iron.Router
==============================================================================
A router that works on the server and the browser, designed specifically for Meteor.

## Install
`meteor add iron:router`

## Quick Start
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
```

## License
MIT
