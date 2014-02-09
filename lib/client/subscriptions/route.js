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