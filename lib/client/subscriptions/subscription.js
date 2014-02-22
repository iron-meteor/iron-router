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
  this.readyDep = new Deps.Dependency();
}

SubscriptionManager.Subscription.prototype.wait = function() {
  this.shouldWait = true;
};

SubscriptionManager.Subscription.prototype.setSubscriptionHandler = function(handler) {
  this.subscriptionHandler = handler;
  this.readyDep.changed();
};

SubscriptionManager.Subscription.prototype.ready = function() {
  if(this.subscriptionHandler) {
    return this.subscriptionHandler.ready();
  } else {
    this.readyDep.depend();
    return false;
  }
};