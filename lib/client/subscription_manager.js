/*****************************************************************************/
/* SubscriptionManager */
/*****************************************************************************/

SubscriptionManager = function () {
  this._subscriptions = {};
  this._subscriptionsByName = {};
  //subscription in the currently viewing page
  //used identify and not to close the subscription when expiring
  this._currentSubscriptions = {};
  this._removeCurrentSubscriptions = false;

  this._rules = {};
  //if there is no rule for a subscription, this will be used
  this._defaultRule = {expireIn: 2};
}

SubscriptionManager.prototype.setRules = function(rules) {
  _.extend(this._rules, rules);
};

SubscriptionManager.prototype.setDefaultRule = function(rule) {
  this._defaultRule = rule;
};

SubscriptionManager.prototype.add = function(subscriptionName) {
  var args = arguments;
  var hash = this._hashArgs(args);
  var sub = this._subscriptions[hash];
  
  if(!sub) {
    sub = new SubscriptionManager.Subscription(this, hash, subscriptionName, args);
    this._subscriptions[hash] = sub;
  }

  this._applyKeep(sub);
  this._applyExpire(sub);

  if(this._removeCurrentSubscriptions) {
    this._currentSubscriptions = {};
    this._removeCurrentSubscriptions = false;
  }
  this._currentSubscriptions[sub.hash] = sub;

  return sub;
};

SubscriptionManager.prototype.run = function() {
  var readyCallbacks = [];
  
  for(var hash in this._subscriptions) {
    var sub = this._subscriptions[hash];
    var rule = this._getRule(sub.name);
    var handler;

    SubscriptionManager.insideIronRouter.withValue(false, function() {
      handler = Meteor.subscribe.apply(Meteor, sub.args);
    });

    sub.setSubscriptionHandler(handler);
    
    //only waiting on subs asked to waitOn explitcily
    if(sub.shouldWait) {
      readyCallbacks.push(handler);
    }

    //no rules or expireIn is not defined or some minus value
    //then we need to expire it right now
    var ruleKeys = _.keys(rule);
    var canExpire = 
      ruleKeys.length == 0 ||
      (ruleKeys.length == 1 && ruleKeys[0] == 'expireIn' && !(rule.expireIn >= 0));

    if(canExpire) {
      console.log('EXPIRING...');
      //do no participate in future
      this._deleteSubscription(sub);
    }
  }

  this._removeCurrentSubscriptions = true;
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

SubscriptionManager.prototype._applyKeep = function(sub) {
  var rule = this._getRule(sub.name);
  var self = this;
  
  //only handle subscriptions with limit > 0
  if(rule.keep > 0) {
    this._subscriptionsByName[sub.name] = this._subscriptionsByName[sub.name] || [];
    var subList = this._subscriptionsByName[sub.name];
    if(sub._limitApplied) {
      //readd subscription to the end of the list
      var index = subList.indexOf(sub);
      subList.splice(index, 1);
      subList.push(sub);
    } else {
      subList.push(sub);
      //check length
      var removeCount = subList.length - rule.keep;
      if(removeCount > 0) {
        var removedSubs = subList.splice(0, removeCount);
        removedSubs.forEach(function(removedSub) {
          self._deleteSubscription(removedSub);
        });
      }
      sub._limitApplied = true;
    }
  }

};

SubscriptionManager.prototype._applyExpire = function(sub) {
  //only handles subscriptions with _expireMinutes > 0
  var rule = this._getRule(sub.name);
  var self = this;
  console.log('=======', sub.name, rule);

  if(rule.expireIn > 0) {
    console.log('INSIDE.....');
    var expireMillies = rule.expireIn * 1000 * 60;

    if(!sub._expireApplied) {
      sub._expireApplied = true;
    } else {
      clearTimeout(sub._expireHandler);
    }
    
    sub._expireHandler = setTimeout(expirationLogic, expireMillies);
  }
  
  function expirationLogic() {
    sub._expireHandler = null;
    self._deleteSubscription(sub);

    //if this is not a current subscription stop subscribing
    if(sub.subscriptionHandler && !self._currentSubscriptions[sub.hash]) {
      sub.subscriptionHandler.stop();
    }
  }
};

SubscriptionManager.prototype._getRule = function(subscriptionName) {
  var rule = this._rules[subscriptionName];
  return rule || this._defaultRule;
};

SubscriptionManager.prototype._deleteSubscription = function(sub) {
  delete this._subscriptions[sub.hash];
  var index = (this._subscriptionsByName[sub.name])? 
    this._subscriptionsByName[sub.name].indexOf(sub): -1;

  if(index >= 0) {
    this._subscriptionsByName[sub.name].splice(index, 1);
  }

  if(sub.expireHandler) {
    clearTimeout(sub.expireHandler);
  }
};

SubscriptionManager.prototype._hashArgs = function(args) {
  var jsonString = JSON.stringify(args);
  var md5String = md5(jsonString);
  return md5String;
}


SubscriptionManager.insideIronRouter = new Meteor.EnvironmentVariable();


/*****************************************************************************/
/* SubscriptionManager.Subscription */
/*****************************************************************************/

SubscriptionManager.Subscription = function(contex, hash, name, args) {
  this.contex = contex;
  this.name = name;
  this.hash = hash;
  this.args = args;

  this.shouldWait = false;
  this.subscriptionHandler = null;
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
/* Meteor.subscribe handling */
/*****************************************************************************/

var originalSubscribe = Meteor.subscribe;
Meteor.subscribe = function() {
  var router = SubscriptionManager.insideIronRouter.get();
  
  if(router) {
    return router.subscriptions.add.apply(router.subscriptions, arguments);
  } else {
    return originalSubscribe.apply(Meteor, arguments);
  }
};