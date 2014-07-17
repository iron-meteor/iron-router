Router.configure({
  // optionally configure a template to use
  // the default loading text to use is "Loading..."
  loadingTemplate: 'Loading'
});

Router.plugin('loading', {only: 'home'});

Router.route('/', {
  name: 'home',
  waitOn: function () {
    return {
      ready: function () { return Session.get('ready'); }
    };
  }
});
