var NoServerRouteError = function() {};

_.extend(IronRouter.prototype, {
  start: function() {
    // XXX: no obvious place to override this
    this.options.routeHandler = function() {};
    
    this.connect();
  },
  
  onUnhandled: function() {
    throw new NoServerRouteError;
  },
  
  connect: function() {
    var connect = Npm.require('connect');
    var router = this;
    
    // XXX: is there a better way to access this?
    __meteor_bootstrap__.app
      .use(connect.query())
      .use(connect.bodyParser())
      .use(function(req, res, next) {
        var Fiber = Npm.require('fibers');
        
        Fiber(function() {
          var context = new RouteContext(req.url);
          
          try {
            router.dispatch(context, _.bind(router.handle, router, res));
          } catch (e) {
            if (e instanceof NoServerRouteError)
              next();
            else
              throw e;
          }
        }).run();
      });
  },
  
  handle: function(response, context) {
    var result = context.route.handler();
    
    // XXX: we need to parse out status code, headers, etc
    
    response.end(result);
  }
});