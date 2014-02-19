/*****************************************************************************/
/* SubscriptionManager.Route */
/*****************************************************************************/

SubscriptionManager.Route = function(context, name, hash) {
  this.context = context;
  this.name = name;
  this.hash = hash;

  this._subs = {};
  this._expireHandler = null;
};

SubscriptionManager.Route.prototype.addSubscription = function(hash) {
  this._subs[hash] = true;
};

SubscriptionManager.Route.prototype.existsSubscription = function(hash) {
  return !!this._subs[hash];
};

SubscriptionManager.Route.prototype.dispose = function() {
  //this needs to done before, closing subscriptions
  this.context._closeRoute(this);

  for(var hash in this._subs) {
    var sub = this._subs[hash];
    this.context._closeSub(sub);
  }

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