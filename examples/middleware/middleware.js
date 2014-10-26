// middleware on the server which uses the same api as Connect
// middleware
Router.use(function (req, res, next) {
  // we use the connect middleware req, res objects here
  console.log(req.method + ": " + req.url);
  next();

  // or, the request, response and next functions are also
  // attached to "this": this.request, this.response, this.next()
}, {where: 'server'});

Router.route('/file', function () {
  this.response.end("here's your file...\n");
}, {where: 'server'});


// middlware on the client
Router.use(function () {
  console.log('Middleware on the client with url: ', this.url);
  this.next();
});

Router.route('/', function () {
  this.render('Home');
});

