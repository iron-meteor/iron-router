@Posts = new Meteor.Collection "posts"

Router.map ->
	@route "home", path: "/"
	@route "posts"
	@route "showPost",
		path: "/posts/:_id"
		data: -> post: Posts.findOne @params._id
	@route "dashboard",
		controller: "DashController"
		action: "customAction"
	@route "notFound", path: "*"

# @route "home" - Specifies a root path maped to the home template
#
# @route "posts" - You can specify a controller, but in this case the controller
# has the same name as the template. So "posts" will by default call
# PostsController. <- Notice the capital P.
#
# @route "showPost" - No need to create a named controller. You can just omit
# the name of the controller and this will create an anonymous controller, which
# allows you to pass in you parameters.  Note: by using the helper pathFor
# 'showPost' in the posts template, Iron Router is smart enough to make a url
# with the correct _id. No need to pass it in.
#
# @route "dashboard" - A RouteController subclass and a custom action are passed
# in. The custom action will render the dashHeader template
		

if Meteor.isServer
	# if no posts exist, add some.
	if Posts.find().count() == 0

		posts = [
			title: "Meteor Source Maps have arrived!"
			body: "You can now map to your CoffeScript source files from the browser."
		,
			title: "Bootstrap 3 Goes Mobile First!"
			body: "With Bootstrap 3, mobile devices will load only necessary Styles and Content."
	
		]

		timeStamp = (new Date()).getTime()

		_.each posts, (postData)->
			post = Posts.insert
				title: postData.title
				body: postData.body
				submitted: timeStamp

			timeStamp +=1
		
	Meteor.publish "allPosts", ->
		Posts.find({},
			sort:
				submitted: -1
		)
			
if Meteor.isClient
	Router.configure
		layout: "layout"
		notFoundTemplate: "notFound"
		loadingTemplate: "loading"

	Subscriptions =
		posts: Meteor.subscribe "allPosts"

	class @PostsController extends RouteController
	
		template: "posts"

		# wait for the posts subscribtion to be ready. 
		# In the meantime, the loading template will display
		waitOn: Subscriptions["posts"]

		data: ->
			posts: Posts.find()

	class @DashController extends RouteController 
		template: "dashboard"

		waitOn: Subscriptions["posts"]

		data: ->
			posts: Posts.find()

		customAction: ->

			@render "posts"
			@render
				dashHeader:
					to: "dashHeader"
					waitOn: false
					data: false
