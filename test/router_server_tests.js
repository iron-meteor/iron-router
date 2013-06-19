// XXX: get rid of this if we can figure out a way to have a router that doesn't make the test blow up
var Router = new IronRouter;
Router.start();

Tinytest.add('IronRouter -- simple server side route', function(test) {
  
  var path = 'server/foo';
  var payload = 'some data';
  Router.map(function() {
    this.route('foo', {path: '/' + path}, function() {
      return payload;
    });
  });
  
  var response = Meteor.http.get(Meteor.absoluteUrl(path));
  test.equal(response.statusCode, 200);
  test.equal(response.content, payload);
});