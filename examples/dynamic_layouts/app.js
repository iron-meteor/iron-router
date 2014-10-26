Router.configure({
  // the default layout
  layoutTemplate: 'LayoutOne'
});

Router.route('/', function () {
  // set the layout programmatically
  this.layout('LayoutOne');

  // render the PageOne template
  this.render('PageOne');
});

Router.route('/two', function () {
  // set the layout based on a reactive session variable
  this.layout(Session.get('layout') || 'LayoutOne');

  // render the PageTwo template
  this.render('PageTwo');

  // render the PageTwoFooter template to the footer region
  this.render('PageTwoFooter', {to: 'footer'});
});

Router.use(function () {
  if (!this.willBeHandledOnServer())
    console.error("No route found for url " + JSON.stringify(this.url) + ".");
});
