Iron.utils.debug = true;

Router.route('/', function () {
  this.layout('ApplicationLayout', {
    //set a data context for the whole layout
    data: {
      title: 'Master Title'
    }
  });

  // will just get the data context from layout
  this.render('PageOne');
});

Router.route('/two', function () {
  this.layout('ApplicationLayout', {
    // set a data context for the whole layout
    data: {
      title: 'Master Title'
    }
  });

  // override the layout data context with a specific
  // data context for the main region.
  this.render('PageTwo', {
    data: {
      title: 'Region Specific Title'
    }
  });
});
