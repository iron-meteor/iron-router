/*****************************************************************************/
/* SubscriptionManager */
/*****************************************************************************/

SubscriptionManager = function () {
  this._subscriptions = {};
  this._routes = {};
  this._defaultRule = {cache: 5, expireIn: 5}

  this._routeCache = {};
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
  var sub = this._subscribe.apply(this, args);
  var route = this._getRoute(routeController);
  if(route.caching) {
    route.addSubscription(sub);
  }
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
  // this._applyExpiration(route, routeController);

  if(!this._currentRoute || this._currentRoute !== route) {
    //a newRoute
    if(this._currentRoute) {
      this._currentRoute.markInactive();
    }

    route.markActive();
    this._currentRoute = route;
  }

  return route;
};

SubscriptionManager.prototype._applyCache = function(route, routeController) {
  var cacheCount = this._getRule(routeController, 'cache');
  if(cacheCount < 0) {
    //we don't process this further
    route.caching = false;
  } else if(cacheCount > 0){
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
      var excessRouteCount = routeList.length - cacheCount;
      if(excessRouteCount > 0) {
        var removedRoutes = routeList.splice(0, excessRouteCount);
        removedRoutes.forEach(function(r) {
          r.dispose();
        });
      }
    }
  }
};

SubscriptionManager.prototype._applyExpiration = function(route, routeController) {
  var expireIn = this._getRule(routeController, 'expireIn');
  if(expireIn == 0) {
    //make sure, we can survive even if deleted by the caching
    route.caching = true;
  } else if(expireIn > 0) {
    var expireInMillis = expireIn * 60 * 1000;
    route.expireIn(expireInMillis);
  }
};

SubscriptionManager.prototype._getRule = function(routeController, ruleName) {
  var rule = routeController[ruleName];
  if(rule === undefined && routeController.options) {
    rule = routeController.options[ruleName];
  }

  if(rule === undefined) {
    rule = this._defaultRule[ruleName];
  }

  return rule;
};

SubscriptionManager.prototype.run = function() {
  var readyCallbacks = [];
  var cachedSubHashes = {};

  _.each(this._routeCache, function(routeList) {
    _.each(routeList, function(route) {
      _.each(route._subs, function(bool, hash) {
        cachedSubHashes[hash] = true;
      });
    });
  });

  var nextSubHashes = _.clone(cachedSubHashes);
  var nextSubs = {};

  if(!this._currentRoute.caching) {
    _.each(this._currentRoute._subs, function(bool, hash) {
      cachedSubHashes[hash] = true;
    });
  }


  for(var hash in cachedSubHashes) {
    var sub = this._subscriptions[hash];

    var handler = SubscriptionManager.insideIronRouter.withValue(false, function() {
      return Meteor.subscribe.apply(Meteor, sub.args);
    });
    sub.setSubscriptionHandler(handler);
    
    //only waiting on subs asked to waitOn explitcily
    if(sub.shouldWait) {
      readyCallbacks.push(handler);
    }

    if(nextSubHashes[hash]) {
      nextSubs[hash] = sub;
    }
  }

  this._subscriptions = nextSubs;

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

SubscriptionManager.prototype._hashArgs = function(args) {
  var jsonString = EJSON.stringify(args);
  var md5String = md5(jsonString);
  return md5String;
}


SubscriptionManager.insideIronRouter = new Meteor.EnvironmentVariable();


/*****************************************************************************/
/* SubscriptionManager.Subscription */
/*****************************************************************************/

SubscriptionManager.Subscription = function(context, hash, name, args) {
  this.context = context;
  this.name = name;
  this.hash = hash;
  this.args = args;

  this.shouldWait = false;
  this.subscriptionHandler = null;
  this.instances = 0;
}

SubscriptionManager.Subscription.prototype.wait = function() {
  this.shouldWait = true;
};

SubscriptionManager.Subscription.prototype.setSubscriptionHandler = function(handler) {
  this.subscriptionHandler = handler;
};

SubscriptionManager.Subscription.prototype.ready = function() {
  if(this.subscriptionHandler) {
    return true;
  } else {
    return false;
  }
};

/*****************************************************************************/
/* SubscriptionManager.Route */
/*****************************************************************************/

SubscriptionManager.Route = function(context, name, hash) {
  this.context = context;
  this.name = name;
  this.hash = hash;
  this.active = false;

  this._subs = {};
  this._activatedSubs = {};
  this._expireHandler = null;
};

SubscriptionManager.Route.prototype.addSubscription = function(sub) {
  if(this.active) {
    this._subs[sub.hash] = true;
    this._activatedSubs[sub.hash] = true;
  } else {
    throw new Error('cannot add a subscription while the route is not active: ' + sub.name + ' ' + sub.hash);
  }
};

SubscriptionManager.Route.prototype.markActive = function() {
  if(this._activatedSubs.length > 0) {
    throw new Error('there cannot exists any active subscriptions' + this._activatedSubs);
  }
  this.active = true;
};

SubscriptionManager.Route.prototype.markInactive = function() {
  var self = this;
  var inactiveSubs = _.difference(_.keys(this._subs), _.keys(this._activatedSubs));
  inactiveSubs.forEach(function(hash) {
    var sub = self._subs[hash];
    // sub.close();
    delete self._subs[hash];
  });
  this._activatedSubs = [];
  this.active = false;
};

SubscriptionManager.Route.prototype.dispose = function() {
  for(var hash in this._subs) {
    var sub = this._subs[hash];
    // sub.close(this);
  }

  //delete from the main
  delete this.context._routes[hash];
  var index = this.context._routeCache[this.name].indexOf(this);
  this.context._routeCache[this.name].splice(index, 1);

  this._subs = {};
  this._activatedSubs = [];
  this.active = false;

  if(this._expireHandler) {
    clearTimeout(this._expireHandler);
  }
};

SubscriptionManager.Route.prototype.expireIn = function(millis) {
  var self = this;
  if(this._expireHandler) {
    throw new Error('there is an expireHandler already');
  } else {
    this._expireHandler = setTimeout(function() {
      self._expireHandler = null;
      self.dispose();
    }, millis);
  }
};

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