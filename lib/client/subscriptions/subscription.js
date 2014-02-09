


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
    return this.subscriptionHandler.ready();
  } else {
    return false;
  }
};