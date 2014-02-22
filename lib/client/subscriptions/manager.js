/*****************************************************************************/
/* SubscriptionManager */
/*****************************************************************************/

SubscriptionManager = function () {
  this._subscriptions = {};
  this._routes = {};

  this._routeCache = {};
  this._currentRoute = null;
}

SubscriptionManager.prototype.setDefaultRule = function(rule) {
  this._defaultRule = rule;
};

SubscriptionManager.prototype._subscribe = function(name) {
  var hash = this._hashArgs(arguments);
  var sub = this._subscriptions[hash];
  if(!sub) {
    sub = new SubscriptionManager.Subscription(this, hash, name, arguments);
    this._subscriptions[hash] = sub;
  }

  sub.instances++;
  return sub;
};

SubscriptionManager.prototype.add = function(routeController, args) {
  var route = this._getRoute(routeController);
  var sub = this._subscribe.apply(this, args);

  route.addSubscription(sub.hash);
  return sub;
};

SubscriptionManager.prototype._getRoute = function(routeController) {
  var routeName = routeController.route.name
  var hash = this._hashArgs(routeController.path);
  var route = this._routes[hash];

  if(!route) {
    route = new SubscriptionManager.Route(this, routeName, hash);
    this._routes[hash] = route;
  }
  
  this._applyCache(route, routeController);
  this._applyExpiration(route, routeController);

  if(!this._currentRoute || this._currentRoute !== route) {
    //a newRoute
    if(this._currentRoute && this._currentRoute.caching !== true) {
      //disposing if it's non-caching route (cleans subs too)
      this._currentRoute.dispose();
    }
    this._currentRoute = route;
  }

  return route;
};

SubscriptionManager.prototype._applyCache = function(route, routeController) {
  var cacheCount = this._getRule(routeController, 'cache');
  
  if(cacheCount === true || cacheCount > 0) {
    route.caching = true;
    //let do the caching
    this._routeCache[route.name] = this._routeCache[route.name] || [];
    var routeList = this._routeCache[route.name];

    var index = routeList.indexOf(route);
    if(index >= 0) {
      //existing route; add it to the bottom
      routeList.splice(index, 1);
      routeList.push(route);
    } else {
      //new route
      routeList.push(route);
      if(cacheCount !== true) {
        //only do the limit if there is value for cacheCount
        var excessRouteCount = routeList.length - cacheCount;
        if(excessRouteCount > 0) {
          var removedRoutes = routeList.splice(0, excessRouteCount);
          removedRoutes.forEach(function(r) {
            r.dispose();
          });
        }
      }
    }
  } else {
    //unknown value for `cache` or not provided
    route.caching = false
  }
};

SubscriptionManager.prototype._applyExpiration = function(route, routeController) {
  var expireIn = this._getRule(routeController, 'expireIn');
  if(expireIn > 0) {
    if(route.caching) {
      var expireInMillis = expireIn * 60 * 1000;
      route.expireIn(expireInMillis);
    } else {
      console.error("IronRouter: cannot set `expireIn` since you've not defined a value for `cache` - (route:", route.name, ")");
    }
  }
};

SubscriptionManager.prototype._getRule = function(routeController, ruleName) {
  var rule = routeController[ruleName];
  if(rule === undefined && routeController.options) {
    rule = routeController.options[ruleName];
  }

  if(rule === undefined) {
    rule = routeController.router.options[ruleName];
  }

  return (rule >=0)? rule: -1;
};

SubscriptionManager.prototype._closeRoute = function(hash) {
  //delete from the main
  var route = this._routes[hash];
  if(route) {
    delete this._routes[hash];
    var routeList = this._routeCache[route.name];
    if(routeList) {
      var index = routeList.indexOf(route);
      routeList.splice(index, 1);
    }
  } else {
    console.warn('No route to delete: ', hash);
  }
};

SubscriptionManager.prototype._closeSub = function(hash) {
  var sub = this._subscriptions[hash];
  if(sub) {
    //need to find out whether is this used by other routes
    var noOneIsUsing = true;
    for(var routeHash in this._routes) {
      var route = this._routes[routeHash];
      if(route.existsSubscription(hash)) {
        noOneIsUsing = false;
        break;
      }
    }

    if(noOneIsUsing) {
      //now we can stop the subscriptionHandler
      var usedInCurrentRoute = this._currentRoute && this._currentRoute.existsSubscription(hash);
      if(sub.subscriptionHandler && !usedInCurrentRoute) {
        sub.subscriptionHandler.stop();
      }
      delete this._subscriptions[hash];
    }
  }
};

SubscriptionManager.prototype.getReadyHandler = function(waitList) {
  var self = this;
  var readyCallbacks = [];


  _.each(self._subscriptions, function(sub, hash) {    
    //only waiting on subs asked to waitOn explitcily
    if(sub.shouldWait) {
      readyCallbacks.push(sub);
    }
  });

  return {
    ready: function() {
      for(var lc=0; lc < readyCallbacks.length; lc++) {
        if(!readyCallbacks[lc].ready()) {
          return false;
        }
      }

      return true;
    }
  }
};

SubscriptionManager.prototype.run = function() {
  var self = this;
  var readyCallbacks = [];

  _.each(self._subscriptions, function(sub, hash) {
    var handler = SubscriptionManager.insideIronRouter.withValue(false, function() {
      return Meteor.subscribe.apply(Meteor, sub.args);
    });
    sub.setSubscriptionHandler(handler);
  });
};

SubscriptionManager.prototype._hashArgs = function(args) {
  var jsonString = EJSON.stringify(args);
  var md5String = md5(jsonString);
  return md5String;
}

/*****************************************************************************/
/* Env Variables */
/*****************************************************************************/

SubscriptionManager.insideIronRouter = new Meteor.EnvironmentVariable();


/*****************************************************************************/
/* Meteor.subscribe handling */
/*****************************************************************************/

var originalSubscribe = Meteor.subscribe;
Meteor.subscribe = function() {
  var routerInfo = SubscriptionManager.insideIronRouter.get();
  
  if(routerInfo) {
    return routerInfo.router.subscriptions.add(routerInfo.controller, arguments);
  } else {
    return originalSubscribe.apply(Meteor, arguments);
  }
};