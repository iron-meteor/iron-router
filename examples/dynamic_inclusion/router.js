/**
 * Dynamic Inclusion Example
 * 
 * This examples shows how to dynamically include templates within a wrapper in second level 
 * routes using only Iron Router
 *
 * Author: http://github.com/flyandi
 */


/**
 * Configure the router with the base template
 */

Router.configure({
  layoutTemplate: 'default'
});


/**
 * This is our first content area
 */

Router.route('/dashboard', {

	yieldTemplates: {
		'dashboard': {to: 'body'}
	},

});

/**
 * This is our second route that has the second level content areas
 */


Router.route("/settings", function() {

	this.redirect("/settings/profile");

});


/**
 * Here we registering our second level content areas
 */

['profile', 'billing', 'account'].forEach(function(path) {


	Router.route('/settings/' + path, {

		yieldTemplates: {
			'settings': {to: 'body'}
		},

		template: path,

	});

});


/**
 * This is just for convience so we always start with our first route
 */
 
Router.route('/', function() {
	this.redirect("/dashboard");
});


