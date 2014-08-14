Router.hooks = {
  auth: function (pause) {
    var sessionKey = 'iron-router.route';
    var globalOptions, layout, newRoute, options, pattern, replaceState,
        template;

    if (this.route.name == '__notfound__')
        return;

    if (Meteor.loggingIn())
      pause();

    if (!Meteor.userId()) {
      options = this.lookupProperty('auth');

      if (options) {
        if (Match.test(options, String))
          options = { route: options };

        pattern = {
          layout: Match.Optional(String),
          route: Match.Optional(String),
          template: Match.Optional(String)
        };

        if (Match.test(options, pattern)) {
          newRoute = options.route;
          template = options.template;

          if (newRoute) {
            opts = this.router.options.auth;

            if (opts)
              replaceState = opts.replaceState;

              if (replaceState === null || typeof replaceState === 'undefined')
                replaceState = true;

              Session.set(sessionKey, this.route.name);
              this.redirect(newRoute, {}, {replaceState: replaceState});

          } else if (template) {
            layout = options.layout;

            if (layout)
              this.layoutTemplate = layout;

            this.render(template);
            this.renderRegions();
            pause();
          }
        }
      }
    }
  },

  dataNotFound: function (pause) {
    var tmpl;

    if (!this.ready())
      return;
    
    // there was never a data function defined at all
    // XXX: it would be more "correct" to call this.lookupProperty('data'),
    //   but it gets overridden by a data() in client/route_controller
    //   that's always defined. We should fix this
    if (this._dataValue === null || typeof this._dataValue === 'undefined')
      return;

    var data = this.data();
    if (data === null || typeof data === 'undefined') {
      tmpl = this.lookupProperty('notFoundTemplate');

      if (tmpl) {
        this.render(tmpl);
        this.renderRegions();
        pause();
      }
    }
  },

  loading: function (pause) {
    var self = this;
    var tmpl;

    if (!this.ready()) {
      tmpl = this.lookupProperty('loadingTemplate');

      if (tmpl) {
        this.render(tmpl);
        this.renderRegions();
        pause();
      }
    }
  }
};
