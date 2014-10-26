Router = new Iron.Router;

if (Meteor.isServer) {
  Router.onBeforeAction(Iron.Router.bodyParser.json());
}
